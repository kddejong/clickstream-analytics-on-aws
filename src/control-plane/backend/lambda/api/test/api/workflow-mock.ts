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

import { Parameter } from '@aws-sdk/client-cloudformation';
import { MOCK_APP_ID, MOCK_PROJECT_ID } from './ddb-mock';

export function mergeParameters(base: Parameter[], attach: Parameter[]) {
  // Deep Copy
  const parameters = JSON.parse(JSON.stringify(base)) as Parameter[];
  const keys = parameters.map(p => p.ParameterKey);
  for (let i = 0; i < attach.length; i++) {
    if (keys.indexOf(attach[i].ParameterKey) > -1) {
      const index = keys.indexOf(attach[i].ParameterKey);
      parameters[index].ParameterValue = attach[i].ParameterValue;
    } else {
      parameters.push(attach[i]);
    }
  }
  return parameters;
}

const BASE_INGESTION_PARAMETERS: Parameter[] = [
  {
    ParameterKey: 'DevMode',
    ParameterValue: 'Yes',
  },
  {
    ParameterKey: 'ClickStreamSDK',
    ParameterValue: 'Yes',
  },
  {
    ParameterKey: 'ProjectId',
    ParameterValue: 'project_8888_8888',
  },
  {
    ParameterKey: 'AppIds',
    ParameterValue: `${MOCK_APP_ID}_1,${MOCK_APP_ID}_2`,
  },
  {
    ParameterKey: 'VpcId',
    ParameterValue: 'vpc-00000000000000001',
  },
  {
    ParameterKey: 'PublicSubnetIds',
    ParameterValue: 'subnet-00000000000000021,subnet-00000000000000022,subnet-00000000000000023',
  },
  {
    ParameterKey: 'PrivateSubnetIds',
    ParameterValue: 'subnet-00000000000000011,subnet-00000000000000012,subnet-00000000000000013',
  },
  {
    ParameterKey: 'Protocol',
    ParameterValue: 'HTTPS',
  },
  {
    ParameterKey: 'DomainName',
    ParameterValue: 'fake.example.com',
  },
  {
    ParameterKey: 'ACMCertificateArn',
    ParameterValue: 'arn:aws:acm:ap-southeast-1:111122223333:certificate/398ce638-e522-40e8-b344-fad5a616e11b',
  },
  {
    ParameterKey: 'ServerEndpointPath',
    ParameterValue: '/collect',
  },
  {
    ParameterKey: 'ServerCorsOrigin',
    ParameterValue: '',
  },
  {
    ParameterKey: 'ServerMax',
    ParameterValue: '4',
  },
  {
    ParameterKey: 'ServerMin',
    ParameterValue: '2',
  },
  {
    ParameterKey: 'WarmPoolSize',
    ParameterValue: '1',
  },
  {
    ParameterKey: 'ScaleOnCpuUtilizationPercent',
    ParameterValue: '50',
  },
  {
    ParameterKey: 'NotificationsTopicArn',
    ParameterValue: 'arn:aws:sns:us-east-1:111122223333:test',
  },
  {
    ParameterKey: 'EnableGlobalAccelerator',
    ParameterValue: 'Yes',
  },
  {
    ParameterKey: 'AuthenticationSecretArn',
    ParameterValue: '',
  },
  {
    ParameterKey: 'EnableAuthentication',
    ParameterValue: 'No',
  },
  {
    ParameterKey: 'EnableApplicationLoadBalancerAccessLog',
    ParameterValue: 'Yes',
  },
  {
    ParameterKey: 'LogS3Bucket',
    ParameterValue: 'EXAMPLE_BUCKET',
  },
  {
    ParameterKey: 'LogS3Prefix',
    ParameterValue: 'logs/',
  },
];

export const INGESTION_S3_PARAMETERS = mergeParameters(
  BASE_INGESTION_PARAMETERS,
  [
    {
      ParameterKey: 'ServerMax',
      ParameterValue: '1',
    },
    {
      ParameterKey: 'ServerMin',
      ParameterValue: '1',
    },
    {
      ParameterKey: 'WarmPoolSize',
      ParameterValue: '0',
    },
    {
      ParameterKey: 'AuthenticationSecretArn',
      ParameterValue: 'arn:aws:secretsmanager:ap-southeast-1:111122223333:secret:test-bxjEaf',
    },
    {
      ParameterKey: 'EnableAuthentication',
      ParameterValue: 'Yes',
    },
    {
      ParameterKey: 'S3DataBucket',
      ParameterValue: 'EXAMPLE_BUCKET',
    },
    {
      ParameterKey: 'S3DataPrefix',
      ParameterValue: 'clickstream/project_8888_8888/data/buffer/',
    },
    {
      ParameterKey: 'S3BatchMaxBytes',
      ParameterValue: '1000000',
    },
    {
      ParameterKey: 'S3BatchTimeout',
      ParameterValue: '60',
    },
    {
      ParameterKey: 'WorkerStopTimeout',
      ParameterValue: '90',
    },
  ],
);

export const INGESTION_S3_WITH_SPECIFY_PREFIX_PARAMETERS = mergeParameters(
  INGESTION_S3_PARAMETERS,
  [
    {
      ParameterKey: 'S3DataPrefix',
      ParameterValue: 'EXAMPLE_PREFIX/',
    },
  ],
);

export const INGESTION_KAFKA_PARAMETERS = mergeParameters(
  BASE_INGESTION_PARAMETERS,
  [
    {
      ParameterKey: 'MskClusterName',
      ParameterValue: '',
    },
    {
      ParameterKey: 'MskSecurityGroupId',
      ParameterValue: 'sg-0000000000002',
    },
    {
      ParameterKey: 'KafkaTopic',
      ParameterValue: 't1',
    },
    {
      ParameterKey: 'KafkaBrokers',
      ParameterValue: 'test1.com:9092,test2.com:9092,test3.com:9092',
    },
  ],
);

export const INGESTION_MSK_PARAMETERS = mergeParameters(
  BASE_INGESTION_PARAMETERS,
  [
    {
      ParameterKey: 'MskClusterName',
      ParameterValue: 'mskClusterName',
    },
    {
      ParameterKey: 'MskSecurityGroupId',
      ParameterValue: 'sg-0000000000002',
    },
    {
      ParameterKey: 'KafkaTopic',
      ParameterValue: 'project_8888_8888',
    },
    {
      ParameterKey: 'KafkaBrokers',
      ParameterValue: 'test1.com:9092,test2.com:9092,test3.com:9092',
    },
  ],
);

export const INGESTION_MSK_WITHOUT_APP_PARAMETERS = mergeParameters(
  BASE_INGESTION_PARAMETERS,
  [
    {
      ParameterKey: 'AppIds',
      ParameterValue: '',
    },
    {
      ParameterKey: 'MskClusterName',
      ParameterValue: 'mskClusterName',
    },
    {
      ParameterKey: 'MskSecurityGroupId',
      ParameterValue: 'sg-0000000000002',
    },
    {
      ParameterKey: 'KafkaTopic',
      ParameterValue: 'project_8888_8888',
    },
    {
      ParameterKey: 'KafkaBrokers',
      ParameterValue: 'test1.com:9092,test2.com:9092,test3.com:9092',
    },
  ],
);

export const INGESTION_KINESIS_ON_DEMAND_PARAMETERS = mergeParameters(
  BASE_INGESTION_PARAMETERS,
  [
    {
      ParameterKey: 'KinesisStreamMode',
      ParameterValue: 'ON_DEMAND',
    },
    {
      ParameterKey: 'KinesisShardCount',
      ParameterValue: '3',
    },
    {
      ParameterKey: 'KinesisDataRetentionHours',
      ParameterValue: '24',
    },
    {
      ParameterKey: 'KinesisBatchSize',
      ParameterValue: '10000',
    },
    {
      ParameterKey: 'KinesisMaxBatchingWindowSeconds',
      ParameterValue: '180',
    },
    {
      ParameterKey: 'KinesisDataS3Bucket',
      ParameterValue: 'EXAMPLE_BUCKET',
    },
    {
      ParameterKey: 'KinesisDataS3Prefix',
      ParameterValue: 'clickstream/project_8888_8888/data/buffer/',
    },
  ],
);

export const INGESTION_KINESIS_PROVISIONED_PARAMETERS = mergeParameters(
  BASE_INGESTION_PARAMETERS,
  [
    {
      ParameterKey: 'KinesisStreamMode',
      ParameterValue: 'PROVISIONED',
    },
    {
      ParameterKey: 'KinesisShardCount',
      ParameterValue: '2',
    },
    {
      ParameterKey: 'KinesisDataRetentionHours',
      ParameterValue: '24',
    },
    {
      ParameterKey: 'KinesisBatchSize',
      ParameterValue: '10000',
    },
    {
      ParameterKey: 'KinesisMaxBatchingWindowSeconds',
      ParameterValue: '300',
    },
    {
      ParameterKey: 'KinesisDataS3Bucket',
      ParameterValue: 'EXAMPLE_BUCKET',
    },
    {
      ParameterKey: 'KinesisDataS3Prefix',
      ParameterValue: 'clickstream/project_8888_8888/data/buffer/',
    },
  ],
);

const BASE_KAFKACONNECTOR_PARAMETERS = [
  {
    ParameterKey: 'ProjectId',
    ParameterValue: 'project_8888_8888',
  },
  {
    ParameterKey: 'DataS3Bucket',
    ParameterValue: 'EXAMPLE_BUCKET',
  },
  {
    ParameterKey: 'DataS3Prefix',
    ParameterValue: 'clickstream/project_8888_8888/data/buffer/',
  },
  {
    ParameterKey: 'LogS3Bucket',
    ParameterValue: 'EXAMPLE_BUCKET',
  },
  {
    ParameterKey: 'LogS3Prefix',
    ParameterValue: 'clickstream/project_8888_8888/logs/kafka-connector/',
  },
  {
    ParameterKey: 'PluginS3Bucket',
    ParameterValue: 'EXAMPLE_BUCKET',
  },
  {
    ParameterKey: 'PluginS3Prefix',
    ParameterValue: 'clickstream/project_8888_8888/runtime/ingestion/kafka-connector/plugins/',
  },
  {
    ParameterKey: 'SubnetIds',
    ParameterValue: 'subnet-00000000000000011,subnet-00000000000000012,subnet-00000000000000013',
  },
  {
    ParameterKey: 'SecurityGroupId',
    ParameterValue: 'sg-0000000000002',
  },
  {
    ParameterKey: 'KafkaBrokers',
    ParameterValue: 'test1.com:9092,test2.com:9092,test3.com:9092',
  },
  {
    ParameterKey: 'KafkaTopic',
    ParameterValue: 't1',
  },
  {
    ParameterKey: 'MskClusterName',
    ParameterValue: '',
  },
  {
    ParameterKey: 'MaxWorkerCount',
    ParameterValue: '3',
  },
  {
    ParameterKey: 'MinWorkerCount',
    ParameterValue: '1',
  },
  {
    ParameterKey: 'WorkerMcuCount',
    ParameterValue: '1',
  },
  {
    ParameterKey: 'RotateIntervalMS',
    ParameterValue: '3000000',
  },
  {
    ParameterKey: 'FlushSize',
    ParameterValue: '50000',
  },
];

export const BASE_KAFKACONNECTOR_BATCH_PARAMETERS = mergeParameters(
  BASE_KAFKACONNECTOR_PARAMETERS,
  [
    {
      ParameterKey: 'RotateIntervalMS',
      ParameterValue: '120000',
    },
    {
      ParameterKey: 'FlushSize',
      ParameterValue: '10000',
    },
  ],
);

export const BASE_KAFKACONNECTOR_BATCH_MSK_PARAMETERS = mergeParameters(
  BASE_KAFKACONNECTOR_PARAMETERS,
  [
    {
      ParameterKey: 'KafkaTopic',
      ParameterValue: 'project_8888_8888',
    },
    {
      ParameterKey: 'MskClusterName',
      ParameterValue: 'mskClusterName',
    },
  ],
);

const BASE_DATA_PROCESSING_PARAMETERS = [
  {
    ParameterKey: 'VpcId',
    ParameterValue: 'vpc-00000000000000001',
  },
  {
    ParameterKey: 'PrivateSubnetIds',
    ParameterValue: 'subnet-00000000000000011,subnet-00000000000000012,subnet-00000000000000013',
  },
  {
    ParameterKey: 'ProjectId',
    ParameterValue: MOCK_PROJECT_ID,
  },
  {
    ParameterKey: 'AppIds',
    ParameterValue: `${MOCK_APP_ID}_1,${MOCK_APP_ID}_2`,
  },
  {
    ParameterKey: 'SourceS3Bucket',
    ParameterValue: 'EXAMPLE_BUCKET',
  },
  {
    ParameterKey: 'SourceS3Prefix',
    ParameterValue: 'clickstream/project_8888_8888/data/buffer/',
  },
  {
    ParameterKey: 'SinkS3Bucket',
    ParameterValue: 'EXAMPLE_BUCKET',
  },
  {
    ParameterKey: 'SinkS3Prefix',
    ParameterValue: 'clickstream/project_8888_8888/data/ods/',
  },
  {
    ParameterKey: 'PipelineS3Bucket',
    ParameterValue: 'EXAMPLE_BUCKET',
  },
  {
    ParameterKey: 'PipelineS3Prefix',
    ParameterValue: 'clickstream/project_8888_8888/data/pipeline-temp/',
  },
  {
    ParameterKey: 'DataFreshnessInHour',
    ParameterValue: '7',
  },
  {
    ParameterKey: 'ScheduleExpression',
    ParameterValue: 'rate(6 minutes)',
  },
  {
    ParameterKey: 'TransformerAndEnrichClassNames',
    ParameterValue: '',
  },
  {
    ParameterKey: 'S3PathPluginJars',
    ParameterValue: '',
  },
  {
    ParameterKey: 'S3PathPluginFiles',
    ParameterValue: '',
  },
  {
    ParameterKey: 'OutputFormat',
    ParameterValue: 'parquet',
  },
];

export const DATA_PROCESSING_PLUGIN1_PARAMETERS = mergeParameters(
  BASE_DATA_PROCESSING_PARAMETERS,
  [
    {
      ParameterKey: 'TransformerAndEnrichClassNames',
      ParameterValue: 'test.aws.solution.main,software.aws.solution.clickstream.UAEnrichment,software.aws.solution.clickstream.IPEnrichment,test.aws.solution.main',
    },
    {
      ParameterKey: 'S3PathPluginJars',
      ParameterValue: 's3://example-bucket/pipeline/jars/test-transformer-0.1.0.jar,s3://example-bucket/pipeline/jars/test-enrich-0.1.0.jar',
    },
    {
      ParameterKey: 'S3PathPluginFiles',
      ParameterValue: 's3://example-bucket/pipeline/files/data1.mmdb,s3://example-bucket/pipeline/files/data2.mmdb,s3://example-bucket/pipeline/files/data3.mmdb,s3://example-bucket/pipeline/files/data4.mmdb',
    },
  ],
);

export const DATA_PROCESSING_WITH_SPECIFY_PREFIX_PLUGIN1_PARAMETERS = mergeParameters(
  DATA_PROCESSING_PLUGIN1_PARAMETERS,
  [
    {
      ParameterKey: 'SourceS3Prefix',
      ParameterValue: 'EXAMPLE_PREFIX/',
    },
  ],
);

export const DATA_PROCESSING_PLUGIN2_PARAMETERS = mergeParameters(
  BASE_DATA_PROCESSING_PARAMETERS,
  [
    {
      ParameterKey: 'SourceS3Prefix',
      ParameterValue: 'clickstream/project_8888_8888/data/buffer/project_8888_8888/',
    },
    {
      ParameterKey: 'TransformerAndEnrichClassNames',
      ParameterValue: 'software.aws.solution.clickstream.TransformerV2,software.aws.solution.clickstream.UAEnrichment,software.aws.solution.clickstream.IPEnrichment,test.aws.solution.main',
    },
    {
      ParameterKey: 'S3PathPluginJars',
      ParameterValue: 's3://example-bucket/pipeline/jars/test-enrich-0.1.0.jar',
    },
    {
      ParameterKey: 'S3PathPluginFiles',
      ParameterValue: 's3://example-bucket/pipeline/files/data3.mmdb,s3://example-bucket/pipeline/files/data4.mmdb',
    },
  ],
);

export const DATA_PROCESSING_PLUGIN3_PARAMETERS = mergeParameters(
  BASE_DATA_PROCESSING_PARAMETERS,
  [
    {
      ParameterKey: 'TransformerAndEnrichClassNames',
      ParameterValue: 'software.aws.solution.clickstream.TransformerV2,software.aws.solution.clickstream.UAEnrichment,software.aws.solution.clickstream.IPEnrichment,test.aws.solution.main',
    },
    {
      ParameterKey: 'S3PathPluginJars',
      ParameterValue: 's3://example-bucket/pipeline/jars/test-enrich-0.1.0.jar',
    },
    {
      ParameterKey: 'S3PathPluginFiles',
      ParameterValue: 's3://example-bucket/pipeline/files/data3.mmdb,s3://example-bucket/pipeline/files/data4.mmdb',
    },
  ],
);

export const DATA_PROCESSING_PLUGIN4_PARAMETERS = mergeParameters(
  BASE_DATA_PROCESSING_PARAMETERS,
  [
    {
      ParameterKey: 'SourceS3Prefix',
      ParameterValue: 'clickstream/project_8888_8888/data/buffer/project_8888_8888/',
    },
    {
      ParameterKey: 'TransformerAndEnrichClassNames',
      ParameterValue: 'software.aws.solution.clickstream.TransformerV2,software.aws.solution.clickstream.UAEnrichment,software.aws.solution.clickstream.IPEnrichment,test.aws.solution.main',
    },
    {
      ParameterKey: 'S3PathPluginJars',
      ParameterValue: 's3://example-bucket/pipeline/jars/test-enrich-0.1.0.jar',
    },
    {
      ParameterKey: 'S3PathPluginFiles',
      ParameterValue: 's3://example-bucket/pipeline/files/data3.mmdb,s3://example-bucket/pipeline/files/data4.mmdb',
    },
    {
      ParameterKey: 'AppIds',
      ParameterValue: '',
    },
  ],
);

const BASE_DATAANALYTICS_PARAMETERS = [
  {
    ParameterKey: 'VpcId',
    ParameterValue: 'vpc-00000000000000001',
  },
  {
    ParameterKey: 'PrivateSubnetIds',
    ParameterValue: 'subnet-00000000000000011,subnet-00000000000000012,subnet-00000000000000013',
  },
  {
    ParameterKey: 'ProjectId',
    ParameterValue: MOCK_PROJECT_ID,
  },
  {
    ParameterKey: 'AppIds',
    ParameterValue: `${MOCK_APP_ID}_1,${MOCK_APP_ID}_2`,
  },
  {
    ParameterKey: 'ODSEventBucket',
    ParameterValue: 'EXAMPLE_BUCKET',
  },
  {
    ParameterKey: 'ODSEventPrefix',
    ParameterValue: 'clickstream/project_8888_8888/data/ods/',
  },
  {
    ParameterKey: 'ODSEventFileSuffix',
    ParameterValue: '.snappy.parquet',
  },
  {
    ParameterKey: 'LoadWorkflowBucket',
    ParameterValue: 'EXAMPLE_BUCKET',
  },
  {
    ParameterKey: 'LoadWorkflowBucketPrefix',
    ParameterValue: 'clickstream/project_8888_8888/data/ods/',
  },
  {
    ParameterKey: 'MaxFilesLimit',
    ParameterValue: '50',
  },
  {
    ParameterKey: 'UpsertUsersScheduleExpression',
    ParameterValue: 'rate(5 minutes)',
  },
  {
    ParameterKey: 'DataProcessingCronOrRateExpression',
    ParameterValue: 'rate(6 minutes)',
  },
  {
    ParameterKey: 'ClearExpiredEventsScheduleExpression',
    ParameterValue: 'cron(0 17 * * ? *)',
  },
  {
    ParameterKey: 'ClearExpiredEventsRetentionRangeDays',
    ParameterValue: '365',
  },
  {
    ParameterKey: 'RedshiftMode',
    ParameterValue: 'New_Serverless',
  },
  {
    ParameterKey: 'RedshiftClusterIdentifier',
    ParameterValue: '',
  },
  {
    ParameterKey: 'RedshiftDbUser',
    ParameterValue: '',
  },
  {
    ParameterKey: 'NewRedshiftServerlessWorkgroupName',
    ParameterValue: '',
  },
  {
    ParameterKey: 'RedshiftServerlessVPCId',
    ParameterValue: '',
  },
  {
    ParameterKey: 'RedshiftServerlessSubnets',
    ParameterValue: '',
  },
  {
    ParameterKey: 'RedshiftServerlessSGs',
    ParameterValue: '',
  },
  {
    ParameterKey: 'RedshiftServerlessRPU',
    ParameterValue: '16',
  },
  {
    ParameterKey: 'RedshiftServerlessNamespaceId',
    ParameterValue: '',
  },
  {
    ParameterKey: 'RedshiftServerlessWorkgroupId',
    ParameterValue: '',
  },
  {
    ParameterKey: 'RedshiftServerlessWorkgroupName',
    ParameterValue: '',
  },
  {
    ParameterKey: 'RedshiftServerlessIAMRole',
    ParameterValue: '',
  },
  {
    ParameterKey: 'EMRServerlessApplicationId.#',
    ParameterValue: '#.Clickstream-DataProcessing-6666-6666.EMRServerlessApplicationId',
  },
  {
    ParameterKey: 'ClickstreamAnalyticsMetadataDdbArn',
    ParameterValue: 'arn:aws:dynamodb:us-east-1:555555555555:table/analytics-metadata-table-name',
  },
];

export const MSK_DATA_PROCESSING_EXISTING_SERVERLESS_DATAANALYTICS_PARAMETERS = mergeParameters(
  BASE_DATAANALYTICS_PARAMETERS,
  [
    {
      ParameterKey: 'UpsertUsersScheduleExpression',
      ParameterValue: 'rate(7 minutes)',
    },
    {
      ParameterKey: 'RedshiftMode',
      ParameterValue: 'Serverless',
    },
    {
      ParameterKey: 'RedshiftServerlessNamespaceId',
      ParameterValue: '3fe99af1-0b02-4b43-b8d4-34ccfd52c865',
    },
    {
      ParameterKey: 'RedshiftServerlessWorkgroupId',
      ParameterValue: 'd60f7989-f4ce-46c5-95da-2f9cc7a27725',
    },
    {
      ParameterKey: 'RedshiftServerlessWorkgroupName',
      ParameterValue: 'test-wg',
    },
    {
      ParameterKey: 'RedshiftServerlessIAMRole',
      ParameterValue: 'arn:aws:iam::555555555555:role/data-analytics-redshift',
    },
  ],
);

export const MSK_DATA_PROCESSING_NEW_SERVERLESS_DATAANALYTICS_PARAMETERS = mergeParameters(
  BASE_DATAANALYTICS_PARAMETERS,
  [
    {
      ParameterKey: 'NewRedshiftServerlessWorkgroupName',
      ParameterValue: 'clickstream-project-8888-8888',
    },
    {
      ParameterKey: 'RedshiftServerlessVPCId',
      ParameterValue: 'vpc-00000000000000001',
    },
    {
      ParameterKey: 'RedshiftServerlessSubnets',
      ParameterValue: 'subnet-00000000000000010,subnet-00000000000000011,subnet-00000000000000012,subnet-00000000000000013',
    },
    {
      ParameterKey: 'RedshiftServerlessSGs',
      ParameterValue: 'sg-00000000000000030,sg-00000000000000031',
    },
    {
      ParameterKey: 'RedshiftServerlessRPU',
      ParameterValue: '8',
    },
  ],
);
export const MSK_DATA_PROCESSING_PROVISIONED_REDSHIFT_DATAANALYTICS_PARAMETERS = mergeParameters(
  BASE_DATAANALYTICS_PARAMETERS,
  [
    {
      ParameterKey: 'RedshiftMode',
      ParameterValue: 'Provisioned',
    },
    {
      ParameterKey: 'RedshiftClusterIdentifier',
      ParameterValue: 'redshift-cluster-1',
    },
    {
      ParameterKey: 'RedshiftDbUser',
      ParameterValue: 'clickstream',
    },
  ],
);

const BASE_REPORTING_PARAMETERS = [
  {
    ParameterKey: 'QuickSightUserParam',
    ParameterValue: 'Admin/clickstream-user-xxx',
  },
  {
    ParameterKey: 'QuickSightNamespaceParam',
    ParameterValue: 'default',
  },
  {
    ParameterKey: 'QuickSightPrincipalParam',
    ParameterValue: 'arn:aws:quicksight:us-west-2:555555555555:user/default/clickstream-user-xxx',
  },
  {
    ParameterKey: 'RedshiftDBParam',
    ParameterValue: 'project_8888_8888',
  },
  {
    ParameterKey: 'RedShiftDBSchemaParam',
    ParameterValue: 'app_7777_7777_1,app_7777_7777_2',
  },
  {
    ParameterKey: 'QuickSightTemplateArnParam',
    ParameterValue: '',
  },
  {
    ParameterKey: 'QuickSightVpcConnectionSubnetParam',
    ParameterValue: 'subnet-00000000000000010,subnet-00000000000000011',
  },
  {
    ParameterKey: 'QuickSightVpcConnectionSGParam',
    ParameterValue: 'sg-00000000000000031',
  },
  {
    ParameterKey: 'RedshiftParameterKeyParam.#',
    ParameterValue: '#.Clickstream-DataModelingRedshift-6666-6666.BIUserCredentialParameterName',
  },
];

export const REPORTING_WITH_PROVISIONED_REDSHIFT_PARAMETERS = [
  ...BASE_REPORTING_PARAMETERS.slice(0, 6),
  {
    ParameterKey: 'RedshiftEndpointParam',
    ParameterValue: 'https://redshift/xxx/yyy',
  },
  {
    ParameterKey: 'RedshiftPortParam',
    ParameterValue: '5002',
  },
  ...BASE_REPORTING_PARAMETERS.slice(6, BASE_REPORTING_PARAMETERS.length),
];

export const REPORTING_WITH_NEW_REDSHIFT_PARAMETERS = [
  {
    ParameterKey: 'QuickSightUserParam',
    ParameterValue: 'clickstream-user-xxx@example.com',
  },
  {
    ParameterKey: 'QuickSightNamespaceParam',
    ParameterValue: 'default',
  },
  {
    ParameterKey: 'QuickSightPrincipalParam',
    ParameterValue: 'arn:aws:quicksight:us-west-2:555555555555:user/default/clickstream-user-xxx',
  },
  {
    ParameterKey: 'RedshiftDBParam',
    ParameterValue: 'project_8888_8888',
  },
  {
    ParameterKey: 'RedShiftDBSchemaParam',
    ParameterValue: 'app_7777_7777_1,app_7777_7777_2',
  },
  {
    ParameterKey: 'QuickSightTemplateArnParam',
    ParameterValue: '',
  },
  {
    ParameterKey: 'RedshiftEndpointParam.#',
    ParameterValue: '#.Clickstream-DataModelingRedshift-6666-6666.StackCreatedRedshiftServerlessWorkgroupEndpointAddress',
  },
  {
    ParameterKey: 'RedshiftPortParam.#',
    ParameterValue: '#.Clickstream-DataModelingRedshift-6666-6666.StackCreatedRedshiftServerlessWorkgroupEndpointPort',
  },
  {
    ParameterKey: 'QuickSightVpcConnectionSubnetParam',
    ParameterValue: 'subnet-00000000000000010,subnet-00000000000000011,subnet-00000000000000012,subnet-00000000000000013',
  },
  {
    ParameterKey: 'QuickSightVpcConnectionSGParam',
    ParameterValue: 'sg-00000000000000030,sg-00000000000000031',
  },
  {
    ParameterKey: 'RedshiftParameterKeyParam.#',
    ParameterValue: '#.Clickstream-DataModelingRedshift-6666-6666.BIUserCredentialParameterName',
  },
];

export const BASE_METRICS_PARAMETERS = [
  {
    ParameterKey: 'ProjectId',
    ParameterValue: 'project_8888_8888',
  },
  {
    ParameterKey: 'Emails',
    ParameterValue: 'u1@example.com,u2@example.com,u3@example.com',
  },
  {
    ParameterKey: 'ColumnNumber',
    ParameterValue: '4',
  },
  {
    ParameterKey: 'LegendPosition',
    ParameterValue: 'bottom',
  },
  {
    ParameterKey: 'Version',
    ParameterValue: '1',
  },
];

export const BASE_METRICS_EMAILS_PARAMETERS = mergeParameters(
  BASE_METRICS_PARAMETERS, [
    {
      ParameterKey: 'Emails',
      ParameterValue: 'u1@example.com,u2@example.com,u3@example.com',
    },
  ]);

export const BASE_ATHENA_PARAMETERS = [
  {
    ParameterKey: 'AthenaDatabase.#',
    ParameterValue: '#.Clickstream-DataProcessing-6666-6666.GlueDatabase',
  },
  {
    ParameterKey: 'AthenaEventTable.#',
    ParameterValue: '#.Clickstream-DataProcessing-6666-6666.GlueEventTable',
  },
];
