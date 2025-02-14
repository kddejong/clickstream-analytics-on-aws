/**
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */

import { SecurityGroupRule, VpcEndpoint } from '@aws-sdk/client-ec2';
import { CronDate, parseExpression } from 'cron-parser';
import { XSS_PATTERN } from './constants-ln';
import { REDSHIFT_MODE } from './model-ln';
import { ClickStreamBadRequestError, ClickStreamSubnet, IngestionServerSinkBatchProps, IngestionServerSizeProps, PipelineSinkType, Policy, SubnetType } from './types';
import { checkVpcEndpoint, containRule, getALBLogServiceAccount, getServerlessRedshiftRPU, getSubnetsAZ, isEmpty } from './utils';
import { CPipelineResources, IPipeline } from '../model/pipeline';
import { describeSecurityGroupsWithRules, describeSubnetsWithType, describeVpcEndpoints, listAvailabilityZones } from '../store/aws/ec2';
import { simulateCustomPolicy } from '../store/aws/iam';
import { describeAccountSubscription } from '../store/aws/quicksight';
import { getS3BucketPolicy } from '../store/aws/s3';
import { getSecretValue } from '../store/aws/secretsmanager';

export const validatePattern = (parameter: string, pattern: string, value: string | undefined) => {
  if (!value) {
    throw new ClickStreamBadRequestError(`Validation error: ${parameter}: undefined not match ${pattern}. Please check and try again.`);
  }
  const regexp = new RegExp(pattern);
  const match = value.match(regexp);
  if (!match || value !== match[0]) {
    throw new ClickStreamBadRequestError(`Validation error: ${parameter}: ${value} not match ${pattern}. Please check and try again.`);
  }
  return true;
};

export const validateXSS = (data: string) => {
  const regexp = new RegExp(XSS_PATTERN);
  const match = data.match(regexp);
  return !isEmpty(match);
};

export const validateSecretModel = async (region: string, key: string, secretArn: string, pattern: string) => {
  try {
    validatePattern(key, pattern, secretArn);
    const secretContent = await getSecretValue(region, secretArn);
    if (!secretContent) {
      throw new ClickStreamBadRequestError('Validation error: AuthenticationSecret is undefined. Please check and try again.');
    }
    const secret = JSON.parse(secretContent);
    const keys = secret.issuer &&
      secret.userEndpoint &&
      secret.authorizationEndpoint &&
      secret.tokenEndpoint &&
      secret.appClientId &&
      secret.appClientSecret;
    if (!keys) {
      throw new ClickStreamBadRequestError('Validation error: AuthenticationSecret format mismatch. Please check and try again.');
    }
  } catch (err) {
    throw new ClickStreamBadRequestError('Validation error: AuthenticationSecret format mismatch. Please check and try again.');
  }
  return true;
};

export const validateServerlessRedshiftRPU = (region: string, rpu: number) => {
  const rpuRange = getServerlessRedshiftRPU(region);
  if (rpuRange.min === 0 || rpuRange.max === 0) {
    throw new ClickStreamBadRequestError('Validation error: the current region does not support ServerlessRedshift.');
  }
  if (rpu % 8 !== 0 || rpu > rpuRange.max || rpu < rpuRange.min) {
    throw new ClickStreamBadRequestError(`Validation error: RPU range must be ${rpuRange.min}-${rpuRange.max} in increments of 8.`);
  }
  return true;
};

export const validatePipelineNetwork = async (pipeline: IPipeline, resources: CPipelineResources) => {

  const network = pipeline.network;
  const { allSubnets, privateSubnets } = await _checkSubnets(pipeline);

  await _checkVpcEndpointsForIsolatedSubnets(pipeline, network.vpcId, privateSubnets, allSubnets);

  await _checkForDataModelingAndReporting(pipeline, allSubnets, resources);

  if (pipeline.ingestionServer.loadBalancer.enableApplicationLoadBalancerAccessLog) {
    const enableAccessLogs = await validateEnableAccessLogsForALB(pipeline.region, pipeline.bucket.name);
    if (!enableAccessLogs) {
      throw new ClickStreamBadRequestError(
        'Validation error: your S3 bucket must have a bucket policy that grants Elastic Load Balancing permission to write the access logs to the bucket.',
      );
    }
  }

  return true;
};

export const validateSinkBatch = (sinkType: PipelineSinkType, sinkBatch: IngestionServerSinkBatchProps) => {
  if (sinkType === PipelineSinkType.KAFKA) {
    if (sinkBatch.intervalSeconds < 0 || sinkBatch.intervalSeconds > 3000) {
      throw new ClickStreamBadRequestError(
        'Validation error: the sink batch interval must 0 <= interval <= 3000 for Kafka sink. ' +
        'Please check and try again.',
      );
    }
    if (sinkBatch.size < 1 || sinkBatch.size > 50000) {
      throw new ClickStreamBadRequestError(
        'Validation error: the sink batch size must 1 <= size <=50000 for Kafka sink. ' +
        'Please check and try again.',
      );
    }
  }
  if (sinkType === PipelineSinkType.KINESIS) {
    if (sinkBatch.intervalSeconds < 0 || sinkBatch.intervalSeconds > 300) {
      throw new ClickStreamBadRequestError(
        'Validation error: the sink batch interval must 0 <= interval <= 300 for Kinesis sink. ' +
        'Please check and try again.',
      );
    }
    if (sinkBatch.size < 1 || sinkBatch.size > 10000) {
      throw new ClickStreamBadRequestError(
        'Validation error: the sink batch size must 1 <= size <= 10000 for Kinesis sink. ' +
        'Please check and try again.',
      );
    }
  }
  return true;
};

export const validateIngestionServerNum = (serverSize: IngestionServerSizeProps) => {
  if (serverSize.serverMin === 1 && serverSize.serverMax === 1) {
    throw new ClickStreamBadRequestError(
      'Validation error: this pipeline not allow to upgrade with the server size minimum and maximum are 1.',
    );
  }
  return true;
};

const validateVpcEndpoint = (region: string,
  allSubnets: ClickStreamSubnet[],
  isolatedSubnetsAZ: string[],
  subnet: ClickStreamSubnet,
  vpcEndpoints: VpcEndpoint[],
  securityGroupsRules: SecurityGroupRule[],
  services: string[]) => {
  let prefix = `com.amazonaws.${region}`;
  if (region.startsWith('cn')) {
    prefix = 'cn.com.amazonaws.cn-northwest-1';
  }
  services = services.map(s => `${prefix}.${s}`);
  const invalidServices = checkVpcEndpoint(
    allSubnets,
    isolatedSubnetsAZ,
    subnet.routeTable!,
    vpcEndpoints,
    securityGroupsRules,
    subnet,
    services);
  if (!isEmpty(invalidServices)) {
    throw new ClickStreamBadRequestError(
      `Validation error: vpc endpoint error in subnet: ${subnet.id}, detail: ${JSON.stringify(invalidServices)}.`,
    );
  }
};

export const validateDataProcessingInterval = (scheduleExpression: string) => {
  if (scheduleExpression.startsWith('rate')) {
    const indexSpace = scheduleExpression.indexOf(' ');
    const fixedValue = parseInt(scheduleExpression.substring(5, indexSpace));
    const fixedUnitStr = scheduleExpression.substring(indexSpace + 1, scheduleExpression.length - 1);
    if (fixedUnitStr.startsWith('minute') && fixedValue < 6) {
      throw new ClickStreamBadRequestError(
        'Validation error: the minimum interval of data processing is 6 minutes.',
      );
    }
    return true;
  } else if (scheduleExpression.startsWith('cron')) {
    const cronExpression = scheduleExpression.substring(5, scheduleExpression.length - 1);
    const res = validateCronInterval(cronExpression, 360000);
    if (!res[0]) {
      throw new ClickStreamBadRequestError(res[1] as string);
    }
    return true;
  }
  throw new ClickStreamBadRequestError(
    'Validation error: schedule expression format error.',
  );
};

const validateCronInterval = (cronExpression: string, maxIntervalMilliSeconds: number) => {
  const nowDate = new Date();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  let options = {
    currentDate: nowDate,
    iterator: true,
  };
  try {
    const interval = parseExpression(cronExpression, options);
    const runTimes = [];
    let num = 0;
    while (num < 10) {
      const obj = interval.next() as IteratorResult<CronDate>;
      runTimes.push(obj.value.getTime());
      num += 1;
    }
    if (runTimes.length === 0) {
      return [false, 'Validation error: schedule expression is not a reasonable interval.'];
    } else {
      let firstTime = runTimes[0];
      for (let i = 1; i < runTimes.length; i++) {
        if (runTimes[i] - firstTime < maxIntervalMilliSeconds) {
          return [false, 'Validation error: the minimum interval of data processing is 6 minutes.'];
        }
        firstTime = runTimes[i];
      }
    }
    return [true, ''];
  } catch (err) {
    return [false, `Validation error: schedule expression(${cronExpression}) parse error.`];
  }
};

export const validateEnableAccessLogsForALB = async (region: string, bucket: string) => {
  const policyStr = await getS3BucketPolicy(region, bucket);
  if (!policyStr) {
    return false;
  }
  const partition = region.startsWith('cn') ? 'aws-cn' : 'aws';
  const policy = JSON.parse(policyStr) as Policy;
  const accountId = getALBLogServiceAccount(region);
  let principal = {
    key: 'Service',
    value: 'logdelivery.elasticloadbalancing.amazonaws.com',
  };
  if (accountId) {
    principal = {
      key: 'AWS',
      value: `arn:${partition}:iam::${accountId}:root`,
    };
  }
  const policyWithoutPrincipal: Policy = {
    Version: '2012-10-17',
    Statement: [],
  };
  for (let statement of policy.Statement) {
    if (statement.Principal &&
      (typeof statement.Principal[principal.key] === 'string' &&
          statement.Principal[principal.key] === principal.value) ||
        (Array.prototype.isPrototypeOf(statement.Principal![principal.key]) &&
          (statement.Principal![principal.key] as string[]).indexOf(principal.value) > -1)) {
      {
        policyWithoutPrincipal.Statement.push({
          Effect: statement.Effect,
          Action: statement.Action,
          Resource: statement.Resource,
          Condition: statement.Condition,
        });
      }
    }
  }
  if (isEmpty(policyWithoutPrincipal.Statement)) {
    return false;
  }
  const simulateResult = await simulateCustomPolicy(
    [JSON.stringify(policyWithoutPrincipal)],
    ['s3:PutObject'],
    [`arn:${partition}:s3:::${bucket}/clickstream/*`],
  );
  return simulateResult;
};

async function _checkForDataModelingAndReporting(pipeline: IPipeline, allSubnets: ClickStreamSubnet[], resources: CPipelineResources) {
  if (pipeline.dataModeling?.redshift) {
    let redshiftType = '';
    let vpcSubnets = allSubnets;
    let redshiftSubnets: ClickStreamSubnet[] = [];
    let redshiftSecurityGroups: string[] = [];
    let redshiftSecurityGroupsRules: SecurityGroupRule[] = [];
    let portOfRedshift = 5439;

    if (pipeline.dataModeling?.redshift?.newServerless) {
      redshiftType = REDSHIFT_MODE.NEW_SERVERLESS;
      ({ redshiftSubnets, redshiftSecurityGroups, redshiftSecurityGroupsRules } =
          await _getRedshiftServerlessConfiguration(pipeline, vpcSubnets));
    } else if (pipeline.dataModeling?.redshift?.provisioned) {
      redshiftType = REDSHIFT_MODE.PROVISIONED;
      ({ redshiftSubnets, redshiftSecurityGroups, redshiftSecurityGroupsRules, portOfRedshift } =
        await _getRedshiftConfiguration(resources, pipeline, vpcSubnets));
    }

    const azSet = new Set<string>();
    const quickSightSubnets: ClickStreamSubnet[] = [];
    for (let subnet of redshiftSubnets) {
      if (!azSet.has(subnet.availabilityZone)) {
        quickSightSubnets.push(subnet);
      }
      azSet.add(subnet.availabilityZone);
    }
    resources.quickSightSubnetIds = quickSightSubnets.map(subnet => subnet.id);

    await _checkForRedshiftServerless(redshiftType, pipeline, azSet, redshiftSubnets);

    await _checkForReporting(pipeline, quickSightSubnets, portOfRedshift, redshiftSecurityGroups, redshiftSecurityGroupsRules, redshiftType);
  }
}

async function _getRedshiftConfiguration(resources: CPipelineResources, pipeline: IPipeline, vpcSubnets: ClickStreamSubnet[]) {
  if (resources?.redshift?.network.vpcId !== pipeline.network.vpcId) {
    vpcSubnets = await describeSubnetsWithType(
      pipeline.region, resources?.redshift?.network.vpcId!, SubnetType.ALL);
  }
  const redshiftSubnets = vpcSubnets.filter(
    subnet => resources?.redshift?.network.subnetIds?.includes(subnet.id));
  const redshiftSecurityGroups = resources?.redshift?.network.securityGroups!;
  const redshiftSecurityGroupsRules = await describeSecurityGroupsWithRules(pipeline.region, redshiftSecurityGroups);
  const portOfRedshift = resources.redshift?.endpoint.port ?? 5439;
  return { vpcSubnets, redshiftSubnets, redshiftSecurityGroups, redshiftSecurityGroupsRules, portOfRedshift };
}

async function _getRedshiftServerlessConfiguration(pipeline: IPipeline, vpcSubnets: ClickStreamSubnet[]) {
  if (pipeline.dataModeling?.redshift?.newServerless?.network.vpcId !== pipeline.network.vpcId) {
    vpcSubnets = await describeSubnetsWithType(
      pipeline.region, pipeline.dataModeling!.redshift!.newServerless!.network.vpcId, SubnetType.ALL);
  }
  const redshiftSubnets = vpcSubnets.filter(
    subnet => pipeline.dataModeling?.redshift?.newServerless?.network.subnetIds.includes(subnet.id));
  const redshiftSecurityGroups = pipeline.dataModeling!.redshift!.newServerless!.network.securityGroups;
  const redshiftSecurityGroupsRules = await describeSecurityGroupsWithRules(pipeline.region, redshiftSecurityGroups);
  return { redshiftSubnets, redshiftSecurityGroups, redshiftSecurityGroupsRules };
}

async function _checkForReporting(pipeline: IPipeline, quickSightSubnets: ClickStreamSubnet[],
  portOfRedshift: number, redshiftSecurityGroups: string[], redshiftSecurityGroupsRules: SecurityGroupRule[],
  redshiftType: string) {
  if (pipeline.reporting) {
    const accountInfo = await describeAccountSubscription();
    if (!accountInfo.AccountInfo?.Edition?.includes('ENTERPRISE')) {
      throw new ClickStreamBadRequestError(
        'Validation error: QuickSight edition is not enterprise in your account.',
      );
    }
    const validSubnets = [];
    for (let quickSightSubnet of quickSightSubnets) {
      const redshiftCidrRule: SecurityGroupRule = {
        IsEgress: false,
        IpProtocol: 'tcp',
        FromPort: portOfRedshift,
        ToPort: portOfRedshift,
        CidrIpv4: quickSightSubnet.cidr,
      };
      if (containRule(redshiftSecurityGroups, redshiftSecurityGroupsRules, redshiftCidrRule)) {
        validSubnets.push(quickSightSubnet.id);
        break;
      }
    }
    if (isEmpty(validSubnets)) {
      throw new ClickStreamBadRequestError(
        `Validation error: ${redshiftType} Redshift security groups missing rule for QuickSight access.`,
      );
    }
  }
}

async function _checkForRedshiftServerless(redshiftType: string, pipeline: IPipeline, azSet: Set<string>, redshiftSubnets: ClickStreamSubnet[]) {
  if (redshiftType === REDSHIFT_MODE.NEW_SERVERLESS) {
    const azInRegion = await listAvailabilityZones(pipeline.region);
    if (azInRegion.length < 2) {
      throw new ClickStreamBadRequestError(
        `Validation error: error in obtaining ${pipeline.region} availability zones information. ` +
        'Please check and try again.',
      );
    } else if (azInRegion.length === 2) {
      if (azSet.size < 2 || redshiftSubnets.length < 3) {
        throw new ClickStreamBadRequestError(
          `Validation error: the network for deploying ${redshiftType} Redshift at least three subnets that cross two AZs. ` +
          'Please check and try again.',
        );
      }
    } else if (azSet.size < 3) {
      throw new ClickStreamBadRequestError(
        `Validation error: the network for deploying ${redshiftType} Redshift at least three subnets that cross three AZs. ` +
        'Please check and try again.',
      );
    }
  }
}

async function _checkVpcEndpointsForIsolatedSubnets(pipeline: IPipeline, vpcId: string,
  privateSubnets: ClickStreamSubnet[], allSubnets: ClickStreamSubnet[]) {
  const isolatedSubnets = privateSubnets.filter(subnet => subnet.type == SubnetType.ISOLATED);
  if (isolatedSubnets.length > 0) {
    const isolatedSubnetsAZ = getSubnetsAZ(isolatedSubnets);
    const vpcEndpoints = await describeVpcEndpoints(pipeline.region, vpcId);
    const vpcEndpointSecurityGroups: string[] = _getEndpointSecurityGroups(vpcEndpoints);

    const vpcEndpointSecurityGroupRules = await describeSecurityGroupsWithRules(pipeline.region, vpcEndpointSecurityGroups);

    for (let privateSubnet of privateSubnets) {
      if (privateSubnet.type === SubnetType.ISOLATED) {
        validateVpcEndpoint(
          pipeline.region,
          allSubnets,
          isolatedSubnetsAZ,
          privateSubnet,
          vpcEndpoints,
          vpcEndpointSecurityGroupRules,
          [
            's3',
            'logs',
          ]);
        _validateEndpointsForModules(pipeline, allSubnets, isolatedSubnetsAZ, privateSubnet, vpcEndpoints, vpcEndpointSecurityGroupRules);
      }
    }
  }
}

function _validateEndpointsForModules(pipeline: IPipeline, allSubnets: ClickStreamSubnet[], isolatedSubnetsAZ: string[],
  privateSubnet: ClickStreamSubnet, vpcEndpoints: VpcEndpoint[], vpcEndpointSecurityGroupRules: SecurityGroupRule[]) {
  if (pipeline.ingestionServer) {
    const services = [
      'ecr.dkr',
      'ecr.api',
      'ecs',
      'ecs-agent',
      'ecs-telemetry',
    ];
    if (pipeline.ingestionServer.sinkType === PipelineSinkType.KINESIS) {
      services.push('kinesis-streams');
    }
    validateVpcEndpoint(
      pipeline.region,
      allSubnets,
      isolatedSubnetsAZ,
      privateSubnet,
      vpcEndpoints,
      vpcEndpointSecurityGroupRules,
      services);
  }
  if (pipeline.dataProcessing) {
    validateVpcEndpoint(
      pipeline.region,
      allSubnets,
      isolatedSubnetsAZ,
      privateSubnet,
      vpcEndpoints,
      vpcEndpointSecurityGroupRules,
      [
        'emr-serverless',
        'glue',
      ]);
  }
  if (pipeline.dataModeling) {
    validateVpcEndpoint(pipeline.region,
      allSubnets,
      isolatedSubnetsAZ,
      privateSubnet,
      vpcEndpoints,
      vpcEndpointSecurityGroupRules,
      [
        'redshift-data',
        'states',
        'sts',
        'dynamodb',
      ]);
  }
}

function _getEndpointSecurityGroups(vpcEndpoints: VpcEndpoint[]) {
  const vpcEndpointSecurityGroups: string[] = [];
  for (let vpce of vpcEndpoints) {
    for (let group of vpce.Groups!) {
      vpcEndpointSecurityGroups.push(group.GroupId!);
    }
  }
  return vpcEndpointSecurityGroups;
}

async function _checkSubnets(pipeline: IPipeline) {
  const network = pipeline.network;
  if (isEmpty(network.privateSubnetIds)) {
    // public subnets only
    // pipeline.network.privateSubnetIds = pipeline.network.publicSubnetIds;
    throw new ClickStreamBadRequestError(
      'Validation error: you must select at least two private subnets for the ingestion endpoint.',
    );
  }
  if (network.publicSubnetIds.length < 2 || network.privateSubnetIds.length < 2) {
    throw new ClickStreamBadRequestError(
      'Validate error: you must select at least two public subnets and at least two private subnets for the ingestion endpoint.',
    );
  }

  const allSubnets = await describeSubnetsWithType(pipeline.region, network.vpcId, SubnetType.ALL);
  const privateSubnets = allSubnets.filter(subnet => network.privateSubnetIds.includes(subnet.id));
  const publicSubnets = allSubnets.filter(subnet => network.publicSubnetIds.includes(subnet.id));
  const privateSubnetsAZ = getSubnetsAZ(privateSubnets);
  const publicSubnetsAZ = getSubnetsAZ(publicSubnets);
  if (publicSubnetsAZ.length < 2 || privateSubnetsAZ.length < 2) {
    throw new ClickStreamBadRequestError(
      'Validate error: the public and private subnets for the ingestion endpoint must locate in at least two Availability Zones (AZ).',
    );
  }
  const azInPublic = publicSubnetsAZ.filter(az => privateSubnetsAZ.includes(az));
  if (azInPublic.length !== privateSubnetsAZ.length) {
    throw new ClickStreamBadRequestError(
      'Validate error: the public subnets and private subnets for ingestion endpoint must be in the same Availability Zones (AZ). '+
      'For example, you can not select public subnets in AZ (a, b), while select private subnets in AZ (b, c).',
    );
  }

  return {
    allSubnets,
    privateSubnets,
  };
}
