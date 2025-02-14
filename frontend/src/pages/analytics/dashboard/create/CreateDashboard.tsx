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
  Box,
  Button,
  ColumnLayout,
  FormField,
  Input,
  Link,
  Modal,
  Popover,
  SpaceBetween,
  Textarea,
  TokenGroup,
} from '@cloudscape-design/components';
import {
  createAnalyticsDashboard,
  getPipelineDetailByProjectId,
} from 'apis/analytics';
import Loading from 'components/common/Loading';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MAX_USER_INPUT_LENGTH } from 'ts/const';
import {
  OUTPUT_REPORTING_QUICKSIGHT_DATA_SOURCE_ARN,
  XSS_PATTERN,
} from 'ts/constant-ln';
import { getValueFromStackOutputs } from 'ts/utils';
import { v4 as uuidv4 } from 'uuid';

interface CreateDashboardProps {
  projectId: string;
  appId: string;
  openModel: boolean;
  closeModel: () => void;
  refreshPage: () => void;
}

const CreateDashboard: React.FC<CreateDashboardProps> = (
  props: CreateDashboardProps
) => {
  const { t } = useTranslation();
  const { projectId, appId, openModel, closeModel, refreshPage } = props;
  const [loadingData, setLoadingData] = useState(false);
  const [pipeline, setPipeline] = useState({} as IPipeline);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [visible, setVisible] = useState(openModel);
  const [curDashboard, setCurDashboard] = useState<IAnalyticsDashboard>({
    name: '',
    description: '',
  } as IAnalyticsDashboard);

  const [dashboardNameRequiredError, setDashboardNameRequiredError] =
    useState(false);
  const [dashboardSheetTooMuchError, setDashboardSheetTooMuchError] =
    useState(false);
  const [sheetName, setSheetName] = React.useState('');
  const [sheetNames, setSheetNames] = React.useState([{ label: 'Sheet 1' }]);

  useEffect(() => {
    setDashboardNameRequiredError(false);
    setVisible(openModel);
  }, [openModel]);

  const confirmCreateDashboard = async () => {
    setLoadingCreate(true);
    try {
      const reportingOutputs = getValueFromStackOutputs(pipeline, 'Reporting', [
        OUTPUT_REPORTING_QUICKSIGHT_DATA_SOURCE_ARN,
      ]);
      const params: IAnalyticsDashboard = {
        ...curDashboard,
        projectId: projectId,
        appId: appId,
        region: pipeline.region,
        ownerPrincipal: pipeline.reporting?.quickSight?.arn,
        defaultDataSourceArn:
          reportingOutputs.get(OUTPUT_REPORTING_QUICKSIGHT_DATA_SOURCE_ARN) ??
          '',
        sheets: sheetNames.map((item) => {
          return { id: uuidv4().replace(/-/g, ''), name: item.label };
        }),
      };
      const { success, data }: ApiResponse<ResponseCreate> =
        await createAnalyticsDashboard(params);
      if (success && data.id) {
        setCurDashboard({
          ...curDashboard,
          name: '',
          description: '',
          sheets: [],
        } as IAnalyticsDashboard);
        closeModel();
        refreshPage();
      }
      setLoadingCreate(false);
    } catch (error) {
      setLoadingCreate(false);
    }
  };

  const loadPipeline = async (projectId: string) => {
    setLoadingData(true);
    try {
      const { success, data }: ApiResponse<IPipeline> =
        await getPipelineDetailByProjectId(projectId);
      if (success) {
        setPipeline(data);
        setLoadingData(false);
      }
    } catch (error) {
      console.log(error);
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadPipeline(projectId);
    }
  }, [projectId]);

  return (
    <div>
      <Modal
        onDismiss={() => {
          closeModel();
        }}
        visible={visible}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => {
                  closeModel();
                }}
              >
                {t('button.cancel')}
              </Button>
              <Button
                loading={loadingCreate}
                variant="primary"
                onClick={() => {
                  if (!curDashboard.name.trim()) {
                    setDashboardNameRequiredError(true);
                    return false;
                  }
                  confirmCreateDashboard();
                }}
              >
                {t('button.create')}
              </Button>
            </SpaceBetween>
          </Box>
        }
        header={t('analytics:dashboard.createTitle')}
      >
        {loadingData ? (
          <Loading isPage />
        ) : (
          <SpaceBetween direction="vertical" size="xs">
            <FormField
              label={t('analytics:dashboard.createInputName')}
              description={t('analytics:dashboard.createInputNameDec')}
              errorText={
                dashboardNameRequiredError
                  ? t('analytics:valid.dashboardNameEmptyError')
                  : ''
              }
            >
              <SpaceBetween direction="vertical" size="s">
                <Input
                  placeholder={
                    t('analytics:dashboard.createInputNamePlaceholder') ?? ''
                  }
                  value={curDashboard.name ?? ''}
                  onChange={(e) => {
                    setDashboardNameRequiredError(false);
                    setCurDashboard((prev) => {
                      return {
                        ...prev,
                        name: e.detail.value,
                      };
                    });
                  }}
                />
              </SpaceBetween>
            </FormField>

            <FormField
              label={t('analytics:dashboard.createDesc')}
              description={t('analytics:dashboard.createDescDec')}
            >
              <Textarea
                placeholder={
                  t('analytics:dashboard.createDescPlaceholder') ?? ''
                }
                rows={3}
                value={curDashboard.description}
                onChange={(e) => {
                  if (
                    new RegExp(XSS_PATTERN).test(e.detail.value) ||
                    e.detail.value.length > MAX_USER_INPUT_LENGTH
                  ) {
                    return false;
                  }
                  setCurDashboard((prev) => {
                    return { ...prev, description: e.detail.value };
                  });
                }}
              />
            </FormField>

            <FormField
              label={t('analytics:dashboard.createSheets')}
              info={
                <Popover
                  triggerType="custom"
                  content={t('analytics:information.dashboardSheetInfo')}
                >
                  <Link variant="info">{t('info')}</Link>
                </Popover>
              }
              description={t('analytics:dashboard.createSheetsDec')}
              errorText={
                dashboardSheetTooMuchError
                  ? t('analytics:valid.dashboardSheetTooMuchError')
                  : ''
              }
            >
              <ColumnLayout columns={2} variant="text-grid">
                <Input
                  onChange={({ detail }) => setSheetName(detail.value)}
                  value={sheetName}
                  placeholder={
                    t('analytics:dashboard.createSheetsPlaceholder') ?? ''
                  }
                />
                <Button
                  iconName="add-plus"
                  onClick={() => {
                    if (!sheetName.trim()) {
                      return false;
                    }
                    if (sheetNames.length >= 10) {
                      setDashboardSheetTooMuchError(true);
                      return false;
                    }
                    setSheetNames(sheetNames.concat({ label: sheetName }));
                  }}
                />
              </ColumnLayout>
              <TokenGroup
                onDismiss={({ detail: { itemIndex } }) => {
                  setSheetNames(
                    sheetNames.filter((item, eIndex) => eIndex !== itemIndex)
                  );
                }}
                items={sheetNames}
              />
            </FormField>
          </SpaceBetween>
        )}
      </Modal>
    </div>
  );
};

export default CreateDashboard;
