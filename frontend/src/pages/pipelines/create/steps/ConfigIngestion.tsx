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

import {
  Alert,
  Button,
  Checkbox,
  ColumnLayout,
  Container,
  ExpandableSection,
  FormField,
  Grid,
  Header,
  Input,
  Link,
  Multiselect,
  Select,
  SelectProps,
  SpaceBetween,
  Tiles,
} from '@cloudscape-design/components';
import { OptionDefinition } from '@cloudscape-design/components/internal/components/option/interfaces';
import { getCertificates, getSSMSecrets, getSubnetList } from 'apis/resource';
import { defaultTo } from 'lodash';
import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  DEFAULT_KDS_BATCH_SIZE,
  DEFAULT_KDS_SINK_INTERVAL,
  DEFAULT_MSK_BATCH_SIZE,
  DEFAULT_MSK_SINK_INTERVAL,
  MAX_KDS_BATCH_SIZE,
  MAX_KDS_SINK_INTERVAL,
  MAX_MSK_BATCH_SIZE,
  MAX_MSK_SINK_INTERVAL,
  MAX_USER_INPUT_LENGTH,
  MIN_KDS_BATCH_SIZE,
  MIN_KDS_SINK_INTERVAL,
  MIN_MSK_BATCH_SIZE,
  MIN_MSK_SINK_INTERVAL,
  ProtocalType,
  SinkType,
} from 'ts/const';
import { XSS_PATTERN } from 'ts/constant-ln';
import {
  PIPELINE_ACCESS_LOG_PERMISSION_LINK_EN,
  PIPELINE_ACCESS_LOG_PERMISSION_LINK_CN,
  PIPELINE_SINK_CONNECTOR_GUIDE,
  PIPELINE_SINK_CONNECTOR_LINK,
  buildDocumentLink,
} from 'ts/url';
import { checkDisable, defaultStr, isDisabled, ternary } from 'ts/utils';
import BufferKDS from './buffer/BufferKDS';
import BufferMSK from './buffer/BufferMSK';
import BufferS3 from './buffer/BufferS3';

interface ConfigIngestionProps {
  update?: boolean;
  pipelineInfo: IExtPipeline;
  changePublicSubnets: (subnets: OptionDefinition[]) => void;
  changePrivateSubnets: (subnets: OptionDefinition[]) => void;
  changeServerMin: (min: string) => void;
  changeServerMax: (max: string) => void;
  changeWarmSize: (size: string) => void;
  changeDomainName: (name: string) => void;
  changeEnableALBAccessLog: (enable: boolean) => void;
  changeEnableAGA: (enable: boolean) => void;
  changeProtocal: (protocal: string) => void;
  changeServerEdp: (endpoint: string) => void;
  changeServerCors: (endpoint: string) => void;
  changeCertificate: (cert: SelectProps.Option) => void;
  changeSSMSecret: (secret: SelectProps.Option) => void;
  changeBufferType: (type: string) => void;
  changeBufferS3Bucket: (s3: string) => void;
  changeBufferS3Prefix: (prefix: string) => void;
  changeS3BufferSize: (size: string) => void;
  changeBufferInterval: (interval: string) => void;
  changeSinkMaxInterval: (interval: string) => void;
  changeSinkBatchSize: (size: string) => void;

  changeSelfHosted: (selfHosted: boolean) => void;
  changeCreateMSKMethod: (type: string) => void;
  changeSelectedMSK: (
    mskOption: SelectProps.Option,
    mskCluster: MSKResponse
  ) => void;
  changeSecurityGroup: (sg: SelectProps.Option) => void;
  changeMSKTopic: (topic: string) => void;
  changeKafkaBrokers: (brokers: string) => void;
  changeKafkaTopic: (topic: string) => void;
  changeEnableKafkaConnector: (enable: boolean) => void;

  changeKDSProvisionType: (provision: SelectProps.Option) => void;
  changeKDSShardNumber: (num: string) => void;
  changeEnableALBAuthentication: (enable: boolean) => void;
  changeAckownledge: () => void;

  publicSubnetError: boolean;
  privateSubnetError: boolean;
  privateSubnetDiffWithPublicError: boolean;
  domainNameEmptyError: boolean;
  domainNameFormatError: boolean;
  certificateEmptyError: boolean;
  bufferS3BucketEmptyError: boolean;
  acknowledgedHTTPSecurity: boolean;
  sinkBatchSizeError: boolean;
  sinkIntervalError: boolean;
  minCapacityError: boolean;
  maxCapacityError: boolean;
  warmPoolError: boolean;
  corsFormatError: boolean;
  secretEmptyError: boolean;
  mskEmptyError: boolean;
  topicFormatError: boolean;
  brokerLinkEmptyError: boolean;
  brokerLinkFormatError: boolean;
  kafkaSGEmptyError: boolean;
  bufferS3PrefixFormatError: boolean;
  bufferS3SizeFormatError: boolean;
  bufferS3IntervalFormatError: boolean;
  bufferKDSModeEmptyError: boolean;
  bufferKDSShardNumFormatError: boolean;
}

const ConfigIngestion: React.FC<ConfigIngestionProps> = (
  props: ConfigIngestionProps
) => {
  const { t, i18n } = useTranslation();
  const {
    update,
    pipelineInfo,
    changePublicSubnets,
    changePrivateSubnets,
    changeServerMin,
    changeServerMax,
    changeWarmSize,
    changeDomainName,
    changeEnableALBAccessLog,
    changeEnableAGA,
    changeProtocal,
    changeServerEdp,
    changeServerCors,
    changeCertificate,
    changeSSMSecret,
    changeBufferType,
    changeBufferS3Bucket,
    changeBufferS3Prefix,
    changeS3BufferSize,
    changeBufferInterval,
    changeSinkMaxInterval,
    changeSinkBatchSize,
    changeSelfHosted,
    changeCreateMSKMethod,
    changeSelectedMSK,
    changeSecurityGroup,
    changeMSKTopic,
    changeKafkaBrokers,
    changeKafkaTopic,
    changeEnableKafkaConnector,
    changeKDSProvisionType,
    changeKDSShardNumber,
    changeAckownledge,
    changeEnableALBAuthentication,
    publicSubnetError,
    privateSubnetError,
    privateSubnetDiffWithPublicError,
    domainNameEmptyError,
    domainNameFormatError,
    certificateEmptyError,
    bufferS3BucketEmptyError,
    acknowledgedHTTPSecurity,
    sinkBatchSizeError,
    sinkIntervalError,
    minCapacityError,
    maxCapacityError,
    warmPoolError,
    corsFormatError,
    secretEmptyError,
    mskEmptyError,
    topicFormatError,
    brokerLinkEmptyError,
    brokerLinkFormatError,
    kafkaSGEmptyError,
    bufferS3PrefixFormatError,
    bufferS3SizeFormatError,
    bufferS3IntervalFormatError,
    bufferKDSModeEmptyError,
    bufferKDSShardNumFormatError,
  } = props;
  const [loadingSubnet, setLoadingSubnet] = useState(false);
  const [loadingCertificate, setLoadingCertificate] = useState(false);
  const [loadingSecret, setLoadingSecret] = useState(false);
  const [publicSubnetOptionList, setPublicSubnetOptionList] =
    useState<SelectProps.Options>([]);
  const [privateSubnetOptionList, setPrivateSubnetOptionList] =
    useState<SelectProps.Options>([]);
  const [certificateOptionList, setCertificateOptionList] =
    useState<SelectProps.Options>([]);
  const [ssmSecretOptionList, setSsmSecretOptionList] =
    useState<SelectProps.Options>([]);

  // get subnet list
  const getSubnetListByRegionAndVPC = async (region: string, vpcId: string) => {
    setLoadingSubnet(true);
    try {
      const { success, data }: ApiResponse<SubnetResponse[]> =
        await getSubnetList({
          region: region,
          vpcId: vpcId,
        });
      if (success) {
        const publicSubnets = data.filter(
          (element) => element.type === 'public'
        );
        const privateSubnets = data.filter(
          (element) => element.type === 'private' || element.type === 'isolated'
        );
        const publicSubnetOptions = publicSubnets.map((element) => ({
          label: `${element.name}(${element.id})`,
          value: element.id,
          description: `${element.availabilityZone}:${element.cidr}`,
        }));
        const privateSubnetOptions = privateSubnets.map((element) => ({
          label: `${element.name}(${element.id})`,
          value: element.id,
          description: `${element.availabilityZone}:${element.cidr}`,
        }));
        setPublicSubnetOptionList(publicSubnetOptions);
        setPrivateSubnetOptionList(privateSubnetOptions);
        setLoadingSubnet(false);
      }
    } catch (error) {
      setLoadingSubnet(false);
    }
  };

  // get certificate list
  const getCertificateListByRegion = async () => {
    setLoadingCertificate(true);
    try {
      const { success, data }: ApiResponse<CetificateResponse[]> =
        await getCertificates({ region: pipelineInfo.region });
      if (success) {
        const certificateOptions: SelectProps.Options = data.map((element) => ({
          label: element.domain,
          value: element.arn,
          disabled: element.status !== 'ISSUED',
        }));
        setCertificateOptionList(certificateOptions);
        setLoadingCertificate(false);
      }
    } catch (error) {
      setLoadingCertificate(false);
    }
  };

  // get ssm secret list
  const getSSMSecretListByRegion = async () => {
    setLoadingSecret(true);
    try {
      const { success, data }: ApiResponse<SSMSecretRepoose[]> =
        await getSSMSecrets({ region: pipelineInfo.region });
      if (success) {
        const secretOptions: SelectProps.Options = data.map((element) => ({
          label: element.name,
          value: element.arn,
        }));
        setSsmSecretOptionList(secretOptions);
        setLoadingSecret(false);
      }
    } catch (error) {
      setLoadingSecret(false);
    }
  };

  useEffect(() => {
    if (!update && pipelineInfo.selectedRegion && pipelineInfo.selectedVPC) {
      getSubnetListByRegionAndVPC(
        pipelineInfo.selectedRegion.value ?? '',
        pipelineInfo.selectedVPC.value ?? ''
      );
    }
  }, [pipelineInfo.selectedRegion, pipelineInfo.selectedVPC]);

  useEffect(() => {
    if (!update) {
      getCertificateListByRegion();
      getSSMSecretListByRegion();
    }
  }, []);

  return (
    <SpaceBetween direction="vertical" size="l">
      <Container
        header={
          <Header
            description={t('pipeline:create.edpSettingsDesc')}
            variant="h2"
          >
            {t('pipeline:create.edpSettings')}
          </Header>
        }
      >
        <SpaceBetween direction="vertical" size="l">
          <FormField
            label={t('pipeline:create.publicSubnet')}
            description={t('pipeline:create.publicSubnetDesc')}
            stretch
            errorText={ternary(
              publicSubnetError,
              t('pipeline:valid.publicSubnetEmpty'),
              undefined
            )}
          >
            <Multiselect
              filteringType="auto"
              disabled={isDisabled(update, pipelineInfo)}
              selectedOptions={pipelineInfo.selectedPublicSubnet}
              tokenLimit={3}
              deselectAriaLabel={(e) => `${t('remove')} ${e.label}`}
              options={publicSubnetOptionList}
              placeholder={defaultStr(t('pipeline:create.subnetPlaceholder'))}
              selectedAriaLabel="Selected"
              statusType={ternary(loadingSubnet, 'loading', 'finished')}
              onChange={(e) => {
                changePublicSubnets(e.detail.selectedOptions as any);
              }}
            />
          </FormField>

          <FormField
            label={t('pipeline:create.privateSubnet')}
            description={t('pipeline:create.privateSubnetDesc')}
            stretch
            errorText={defaultTo(
              ternary(
                privateSubnetError,
                t('pipeline:valid.privateSubnetEmpty'),
                undefined
              ),
              ternary(
                privateSubnetDiffWithPublicError,
                t('pipeline:valid.privateSubnetDiffWithPublicError'),
                undefined
              )
            )}
          >
            <Multiselect
              filteringType="auto"
              disabled={isDisabled(update, pipelineInfo)}
              selectedOptions={pipelineInfo.selectedPrivateSubnet}
              tokenLimit={3}
              deselectAriaLabel={(e) => `${t('remove')} ${e.label}`}
              options={privateSubnetOptionList}
              placeholder={defaultStr(t('pipeline:create.subnetPlaceholder'))}
              selectedAriaLabel="Selected"
              statusType={ternary(loadingSubnet, 'loading', 'finished')}
              onChange={(e) => {
                changePrivateSubnets(e.detail.selectedOptions as any);
              }}
            />
          </FormField>

          <FormField
            label={t('pipeline:create.ingestionCapacity')}
            description={t('pipeline:create.ingestionCapacityDesc')}
            stretch
          >
            <ColumnLayout columns={3}>
              <FormField
                stretch
                errorText={ternary(
                  minCapacityError,
                  t('pipeline:valid.minCapacityError'),
                  undefined
                )}
              >
                <div>{t('pipeline:create.minSize')}</div>
                <Input
                  type="number"
                  value={pipelineInfo.ingestionServer.size.serverMin.toString()}
                  onChange={(e) => {
                    changeServerMin(e.detail.value);
                  }}
                />
              </FormField>
              <FormField
                stretch
                errorText={ternary(
                  maxCapacityError,
                  t('pipeline:valid.maxCapacityError'),
                  undefined
                )}
              >
                <div>{t('pipeline:create.maxSize')}</div>
                <Input
                  type="number"
                  value={pipelineInfo.ingestionServer.size.serverMax.toString()}
                  onChange={(e) => {
                    changeServerMax(e.detail.value);
                  }}
                />
              </FormField>
              <FormField
                stretch
                errorText={ternary(
                  warmPoolError,
                  t('pipeline:valid.warmPoolError'),
                  undefined
                )}
              >
                <div>{t('pipeline:create.warmPool')}</div>
                <Input
                  type="number"
                  value={pipelineInfo.ingestionServer.size.warmPoolSize.toString()}
                  onChange={(e) => {
                    changeWarmSize(e.detail.value);
                  }}
                />
              </FormField>
            </ColumnLayout>
          </FormField>

          <FormField>
            <Checkbox
              disabled={isDisabled(update, pipelineInfo)}
              onChange={({ detail }) =>
                changeProtocal(
                  detail.checked ? ProtocalType.HTTPS : ProtocalType.HTTP
                )
              }
              checked={
                pipelineInfo.ingestionServer.loadBalancer.protocol ===
                ProtocalType.HTTPS
              }
            >
              <b>{t('pipeline:create.enableHttps')}</b>
            </Checkbox>
          </FormField>

          {pipelineInfo.ingestionServer.loadBalancer.protocol ===
            ProtocalType.HTTP && (
            <FormField
              stretch
              errorText={ternary(
                !acknowledgedHTTPSecurity,
                t('pipeline:valid.acknowledgeHTTPSecurity'),
                undefined
              )}
            >
              <div className="mb-5">
                <Alert
                  type="warning"
                  action={
                    !acknowledgedHTTPSecurity && (
                      <Button
                        onClick={() => {
                          changeAckownledge();
                        }}
                      >
                        {t('button.acknowledge')}
                      </Button>
                    )
                  }
                  header={t('pipeline:create.securityWarning')}
                >
                  {t('pipeline:create.securityWarningDesc')}
                </Alert>
              </div>
            </FormField>
          )}

          {pipelineInfo.ingestionServer.loadBalancer.protocol ===
            ProtocalType.HTTPS && (
            <Grid
              gridDefinition={[{ colspan: 4 }, { colspan: 4 }, { colspan: 4 }]}
            >
              <div>
                <FormField
                  label={t('pipeline:create.domainName')}
                  errorText={defaultTo(
                    ternary(
                      domainNameEmptyError,
                      t('pipeline:valid.domainNameEmpty'),
                      undefined
                    ),
                    ternary(
                      domainNameFormatError,
                      t('pipeline:valid.domainNameInvalid'),
                      undefined
                    )
                  )}
                >
                  <Input
                    disabled={isDisabled(update, pipelineInfo)}
                    placeholder="example.domain.com"
                    value={pipelineInfo.ingestionServer.domain.domainName}
                    onChange={(e) => {
                      if (
                        new RegExp(XSS_PATTERN).test(e.detail.value) ||
                        e.detail.value.length > MAX_USER_INPUT_LENGTH
                      ) {
                        return false;
                      }
                      changeDomainName(e.detail.value);
                    }}
                  />
                </FormField>
              </div>
              <div>
                <FormField
                  label={t('pipeline:create.certificate')}
                  errorText={ternary(
                    certificateEmptyError,
                    t('pipeline:valid.certificateEmpty'),
                    undefined
                  )}
                >
                  <Select
                    disabled={isDisabled(update, pipelineInfo)}
                    statusType={ternary(
                      loadingCertificate,
                      'loading',
                      'finished'
                    )}
                    placeholder={defaultStr(
                      t('pipeline:create.selectCertificate')
                    )}
                    selectedOption={pipelineInfo.selectedCertificate}
                    options={certificateOptionList}
                    onChange={(e) => {
                      changeCertificate(e.detail.selectedOption);
                    }}
                  />
                </FormField>
              </div>
              <div
                style={{
                  paddingTop: 25,
                }}
              >
                {!update ? (
                  <Button
                    iconName="refresh"
                    loading={loadingCertificate}
                    onClick={() => {
                      getCertificateListByRegion();
                    }}
                  />
                ) : null}
              </div>
            </Grid>
          )}

          {pipelineInfo.ingestionServer.loadBalancer.protocol ===
            ProtocalType.HTTPS && (
            <Alert header={t('pipeline:create.nextSteps')}>
              {t('pipeline:create.nextStepsDesc')}
            </Alert>
          )}

          <FormField
            label={t('pipeline:create.cors')}
            description={t('pipeline:create.corsDesc')}
            errorText={ternary(
              corsFormatError,
              t('pipeline:valid.corsFormatError'),
              undefined
            )}
          >
            <Input
              placeholder={defaultStr(t('pipeline:create.corsPlaceholder'))}
              value={pipelineInfo.ingestionServer.loadBalancer.serverCorsOrigin}
              onChange={(e) => {
                if (
                  new RegExp(XSS_PATTERN).test(e.detail.value) ||
                  e.detail.value.length > MAX_USER_INPUT_LENGTH
                ) {
                  return false;
                }
                changeServerCors(e.detail.value);
              }}
            />
          </FormField>

          <ExpandableSection headerText={t('additionalSettings')}>
            <SpaceBetween direction="vertical" size="l">
              <FormField
                label={t('pipeline:create.requestPath')}
                description={t('pipeline:create.requestPathDesc')}
              >
                <Input
                  placeholder={defaultStr(
                    t('pipeline:create.requestPlaceholder')
                  )}
                  value={
                    pipelineInfo.ingestionServer.loadBalancer.serverEndpointPath
                  }
                  onChange={(e) => {
                    if (
                      new RegExp(XSS_PATTERN).test(e.detail.value) ||
                      e.detail.value.length > MAX_USER_INPUT_LENGTH
                    ) {
                      return false;
                    }
                    changeServerEdp(e.detail.value);
                  }}
                />
              </FormField>

              <Checkbox
                controlId="test-aga-id"
                disabled={checkDisable(
                  isDisabled(update, pipelineInfo),
                  !pipelineInfo.serviceStatus.AGA
                )}
                onChange={({ detail }) => {
                  changeEnableAGA(detail.checked);
                }}
                checked={
                  pipelineInfo.ingestionServer.loadBalancer
                    .enableGlobalAccelerator
                }
                description={t('pipeline:create.agaDesc')}
              >
                <b>{t('pipeline:create.aga')}</b>
              </Checkbox>

              <div>
                <Checkbox
                  disabled={isDisabled(update, pipelineInfo)}
                  onChange={({ detail }) =>
                    changeEnableALBAuthentication(detail.checked)
                  }
                  checked={pipelineInfo.enableAuthentication}
                  description={t('pipeline:create.authDesc')}
                >
                  <b>{t('pipeline:create.auth')}</b>
                </Checkbox>
                <div className="plr-20">
                  {pipelineInfo.enableAuthentication && (
                    <FormField
                      label={t('pipeline:create.secret')}
                      errorText={ternary(
                        secretEmptyError,
                        t('pipeline:valid.secretEmptyError'),
                        undefined
                      )}
                    >
                      <div className="flex">
                        <div className="flex-1">
                          <Select
                            filteringType="auto"
                            disabled={isDisabled(update, pipelineInfo)}
                            statusType={ternary(
                              loadingSecret,
                              'loading',
                              'finished'
                            )}
                            placeholder={defaultStr(
                              t('pipeline:create.selectSecret')
                            )}
                            selectedOption={pipelineInfo.selectedSecret}
                            options={ssmSecretOptionList}
                            onChange={(e) => {
                              changeSSMSecret(e.detail.selectedOption);
                            }}
                          />
                        </div>
                        <div className="ml-10">
                          <Button
                            iconName="refresh"
                            loading={loadingSecret}
                            onClick={() => {
                              getSSMSecretListByRegion();
                            }}
                          />
                        </div>
                      </div>
                    </FormField>
                  )}
                </div>
              </div>

              <Checkbox
                disabled={isDisabled(update, pipelineInfo)}
                onChange={({ detail }) =>
                  changeEnableALBAccessLog(detail.checked)
                }
                checked={
                  pipelineInfo.ingestionServer.loadBalancer
                    .enableApplicationLoadBalancerAccessLog
                }
                description={
                  <div>
                    {t('pipeline:create.enableALBLogDesc')}
                    <Link
                      external
                      href={buildDocumentLink(
                        i18n.language,
                        PIPELINE_ACCESS_LOG_PERMISSION_LINK_EN,
                        PIPELINE_ACCESS_LOG_PERMISSION_LINK_CN
                      )}
                    >
                      {t('learnMore')}
                    </Link>
                  </div>
                }
              >
                <b>{t('pipeline:create.enableALBLog')}</b>
              </Checkbox>
            </SpaceBetween>
          </ExpandableSection>
        </SpaceBetween>
      </Container>
      <Container
        header={
          <Header variant="h2" description={t('pipeline:create.dataSinkDesc')}>
            {t('pipeline:create.dataSink')}
          </Header>
        }
      >
        <SpaceBetween direction="vertical" size="l">
          <FormField
            label={t('pipeline:create.bufferType')}
            description={t('pipeline:create.bufferTypeDesc')}
            stretch
          >
            <Tiles
              onChange={({ detail }) => changeBufferType(detail.value)}
              value={pipelineInfo.ingestionServer.sinkType}
              columns={1}
              items={[
                {
                  label: t('pipeline:create.bufferKDS'),
                  description: t('pipeline:create.bufferKDSDesc'),
                  value: SinkType.KDS,
                  disabled: isDisabled(update, pipelineInfo),
                },
                {
                  controlId: 'test-select-msk-buffer',
                  label: t('pipeline:create.bufferMSK'),
                  description: t('pipeline:create.bufferMSKDesc'),
                  value: SinkType.MSK,
                  disabled: checkDisable(
                    isDisabled(update, pipelineInfo),
                    !pipelineInfo.serviceStatus.MSK
                  ),
                },
                {
                  label: t('pipeline:create.bufferS3'),
                  description: t('pipeline:create.bufferS3Desc'),
                  value: SinkType.S3,
                  disabled: isDisabled(update, pipelineInfo),
                },
              ]}
            />
          </FormField>

          {pipelineInfo.ingestionServer.sinkType === SinkType.S3 && (
            <BufferS3
              update={update}
              pipelineInfo={pipelineInfo}
              bufferS3BucketEmptyError={bufferS3BucketEmptyError}
              bufferS3PrefixFormatError={bufferS3PrefixFormatError}
              bufferS3SizeFormatError={bufferS3SizeFormatError}
              bufferS3IntervalFormatError={bufferS3IntervalFormatError}
              changeS3Bucket={(bucket) => {
                changeBufferS3Bucket(bucket);
              }}
              changeS3Prefix={(prefix) => {
                changeBufferS3Prefix(prefix);
              }}
              changeS3BufferSize={(size) => {
                changeS3BufferSize(size);
              }}
              changeBufferInterval={(interval) => {
                changeBufferInterval(interval);
              }}
            />
          )}
          {pipelineInfo.ingestionServer.sinkType === SinkType.MSK && (
            <BufferMSK
              update={update}
              pipelineInfo={pipelineInfo}
              mskEmptyError={mskEmptyError}
              topicFormatError={topicFormatError}
              brokerLinkEmptyError={brokerLinkEmptyError}
              brokerLinkFormatError={brokerLinkFormatError}
              kafkaSGEmptyError={kafkaSGEmptyError}
              changeCreateMSKMethod={(type) => {
                changeCreateMSKMethod(type);
              }}
              changeSelectedMSK={(msk, mskCluster) => {
                changeSelectedMSK(msk, mskCluster);
              }}
              changeMSKTopic={(topic) => {
                changeMSKTopic(topic);
              }}
              changeSelfHosted={(selfHosted) => {
                changeSelfHosted(selfHosted);
              }}
              changeKafkaBrokers={(brokers) => {
                changeKafkaBrokers(brokers);
              }}
              changeKafkaTopic={(topic) => {
                changeKafkaTopic(topic);
              }}
              changeSecurityGroup={(sg) => {
                changeSecurityGroup(sg);
              }}
            />
          )}
          {pipelineInfo.ingestionServer.sinkType === SinkType.KDS && (
            <BufferKDS
              update={update}
              pipelineInfo={pipelineInfo}
              bufferKDSModeEmptyError={bufferKDSModeEmptyError}
              bufferKDSShardNumFormatError={bufferKDSShardNumFormatError}
              changeKDSProvisionType={(type) => {
                changeKDSProvisionType(type);
              }}
              changeKDSShardNumber={(num) => {
                changeKDSShardNumber(num);
              }}
            />
          )}

          {pipelineInfo.ingestionServer.sinkType === SinkType.MSK && (
            <Container
              header={
                <Header
                  description={t('pipeline:create.connectorDesc')}
                  variant="h3"
                >
                  {t('pipeline:create.connector')}
                </Header>
              }
            >
              <FormField>
                <Checkbox
                  disabled={checkDisable(
                    isDisabled(update, pipelineInfo),
                    !pipelineInfo.serviceStatus.MSK
                  )}
                  onChange={({ detail }) =>
                    changeEnableKafkaConnector(detail.checked)
                  }
                  checked={
                    pipelineInfo.ingestionServer.sinkKafka.kafkaConnector.enable
                  }
                  description={
                    <div>
                      <Trans
                        i18nKey="pipeline:create.connectorCheck"
                        components={{
                          connector_anchor: (
                            <Link
                              external
                              href={PIPELINE_SINK_CONNECTOR_LINK}
                            />
                          ),
                          guide_anchor: (
                            <Link
                              external
                              href={PIPELINE_SINK_CONNECTOR_GUIDE}
                            />
                          ),
                        }}
                      />
                    </div>
                  }
                >
                  {t('pipeline:create.connectorCheckDesc')}
                </Checkbox>
              </FormField>
            </Container>
          )}

          {(pipelineInfo.ingestionServer.sinkType === SinkType.MSK ||
            pipelineInfo.ingestionServer.sinkType === SinkType.KDS) && (
            <ExpandableSection headerText={t('additionalSettings')}>
              <SpaceBetween direction="vertical" size="l">
                <FormField
                  label={t('pipeline:create.sinkMaxInterval')}
                  description={t('pipeline:create.sinkMaxIntervalDesc')}
                  errorText={ternary(
                    sinkIntervalError,
                    t('pipeline:valid.sinkIntervalError', {
                      min: ternary(
                        pipelineInfo.ingestionServer.sinkType === SinkType.KDS,
                        MIN_KDS_SINK_INTERVAL,
                        MIN_MSK_SINK_INTERVAL
                      ),
                      max: ternary(
                        pipelineInfo.ingestionServer.sinkType === SinkType.KDS,
                        MAX_KDS_SINK_INTERVAL,
                        MAX_MSK_SINK_INTERVAL
                      ),
                    }),
                    undefined
                  )}
                >
                  <Input
                    type="number"
                    placeholder={ternary(
                      pipelineInfo.ingestionServer.sinkType === SinkType.KDS,
                      DEFAULT_KDS_SINK_INTERVAL,
                      DEFAULT_MSK_SINK_INTERVAL
                    )}
                    value={pipelineInfo.ingestionServer.sinkBatch?.intervalSeconds.toString()}
                    onChange={(e) => {
                      changeSinkMaxInterval(e.detail.value);
                    }}
                  />
                </FormField>
                <FormField
                  label={t('pipeline:create.sinkBatchSize')}
                  description={t('pipeline:create.sinkBatchSizeDesc')}
                  errorText={ternary(
                    sinkBatchSizeError,
                    t('pipeline:valid.sinkSizeError', {
                      min: ternary(
                        pipelineInfo.ingestionServer.sinkType === SinkType.KDS,
                        MIN_KDS_BATCH_SIZE,
                        MIN_MSK_BATCH_SIZE
                      ),
                      max: ternary(
                        pipelineInfo.ingestionServer.sinkType === SinkType.KDS,
                        MAX_KDS_BATCH_SIZE,
                        MAX_MSK_BATCH_SIZE
                      ),
                    }),
                    undefined
                  )}
                >
                  <Input
                    type="number"
                    placeholder={ternary(
                      pipelineInfo.ingestionServer.sinkType === SinkType.KDS,
                      DEFAULT_KDS_BATCH_SIZE,
                      DEFAULT_MSK_BATCH_SIZE
                    )}
                    value={pipelineInfo.ingestionServer.sinkBatch.size.toString()}
                    onChange={(e) => {
                      changeSinkBatchSize(e.detail.value);
                    }}
                  />
                </FormField>
              </SpaceBetween>
            </ExpandableSection>
          )}
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );
};

export default ConfigIngestion;
