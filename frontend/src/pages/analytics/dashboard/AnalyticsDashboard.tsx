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
  AppLayout,
  Box,
  Cards,
  Link,
  Pagination,
} from '@cloudscape-design/components';
import { getAnalyticsDashboardList } from 'apis/analytics';
import AnalyticsNavigation from 'components/layouts/AnalyticsNavigation';
import CustomBreadCrumb from 'components/layouts/CustomBreadCrumb';
import HelpInfo from 'components/layouts/HelpInfo';
import { DispatchContext, StateContext } from 'context/StateContext';
import { HelpInfoActionType, HelpPanelType } from 'context/reducer';
import moment from 'moment';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { TIME_FORMAT } from 'ts/const';
import { DEFAULT_DASHBOARD_NAME } from 'ts/constant-ln';
import CreateDashboard from './create/CreateDashboard';
import DashboardHeader from '../comps/DashboardHeader';

const AnalyticsDashboardCard: React.FC<any> = () => {
  const { t } = useTranslation();
  const { projectId, appId } = useParams();
  const [pageSize] = useState(12);
  const [loadingData, setLoadingData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedItems, setSelectedItems] = useState<IAnalyticsDashboard[]>([]);
  const [createDashboardVisible, setCreateDashboardVisible] = useState(false);
  const [analyticsDashboardList, setAnalyticsDashboardList] = useState<
    IAnalyticsDashboard[]
  >([]);

  const buildCardHeader = (item: IAnalyticsDashboard) => {
    return (
      <Link
        variant="secondary"
        fontSize="heading-m"
        href={`/analytics/${projectId}/app/${appId}/dashboard/${item.id}`}
      >
        {item.name === DEFAULT_DASHBOARD_NAME ? (
          <>
            {t('analytics:dashboard.defaultUserLifecycle')} -
            {
              <small>
                <i> {t('analytics:dashboard.defaultTag')}</i>
              </small>
            }
          </>
        ) : (
          item.name
        )}
      </Link>
    );
  };

  const CARD_DEFINITIONS = {
    header: (item: IAnalyticsDashboard) => buildCardHeader(item),
    sections: [
      {
        id: 'description',
        header: '',
        content: (item: IAnalyticsDashboard) => item.description || '-',
      },
      {
        id: 'createAt',
        header: t('analytics:list.createAt'),
        content: (item: IAnalyticsDashboard) =>
          item?.createAt ? moment(item?.createAt).format(TIME_FORMAT) : '-',
      },
      {
        id: 'operator',
        header: t('analytics:list.createdBy'),
        content: (item: IAnalyticsDashboard) => item.operator || '-',
      },
    ],
  };

  const listAnalyticsDashboards = async () => {
    setLoadingData(true);
    try {
      const {
        success,
        data,
      }: ApiResponse<ResponseTableData<IAnalyticsDashboard>> =
        await getAnalyticsDashboardList({
          projectId: projectId ?? '',
          appId: appId ?? '',
          pageNumber: currentPage,
          pageSize: pageSize,
        });
      if (success) {
        setAnalyticsDashboardList(data.items);
        setTotalCount(data.totalCount);
        setLoadingData(false);
      }
    } catch (error) {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (projectId && appId) {
      listAnalyticsDashboards();
    }
  }, [currentPage]);

  return (
    <div className="pb-30">
      <Cards
        loading={loadingData}
        selectedItems={selectedItems}
        onSelectionChange={(event) => {
          setSelectedItems(event.detail.selectedItems);
        }}
        stickyHeader={false}
        cardDefinition={CARD_DEFINITIONS}
        loadingText={t('analytics:list.loading') ?? ''}
        items={analyticsDashboardList}
        variant="full-page"
        selectionType="single"
        empty={
          <Box textAlign="center" color="inherit">
            <Box padding={{ bottom: 's' }} variant="p" color="inherit">
              <b>{t('analytics:list.noDashboard')}</b>
            </Box>
          </Box>
        }
        header={
          <DashboardHeader
            totalNum={totalCount}
            dashboard={selectedItems?.[0]}
            setSelectItemEmpty={() => {
              setSelectedItems([]);
            }}
            onClickCreate={() => {
              setCreateDashboardVisible(true);
            }}
            refreshPage={() => {
              setSelectedItems([]);
              listAnalyticsDashboards();
            }}
          />
        }
        pagination={
          <Pagination
            currentPageIndex={currentPage}
            pagesCount={Math.ceil(totalCount / pageSize)}
            onChange={(e) => {
              setCurrentPage(e.detail.currentPageIndex);
            }}
          />
        }
      />
      <CreateDashboard
        projectId={projectId ?? ''}
        appId={appId ?? ''}
        openModel={createDashboardVisible}
        closeModel={() => setCreateDashboardVisible(false)}
        refreshPage={() => {
          setSelectedItems([]);
          listAnalyticsDashboards();
        }}
      />
    </div>
  );
};

const AnalyticsDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { projectId, appId } = useParams();
  const state = useContext(StateContext);
  const dispatch = useContext(DispatchContext);

  const breadcrumbItems = [
    {
      text: t('breadCrumb.analyticsStudio'),
      href: '/analytics',
    },
    {
      text: t('breadCrumb.dashboard'),
      href: `/analytics/${projectId}/app/${appId}/dashboards`,
    },
  ];

  return (
    <div className="flex">
      <AnalyticsNavigation
        activeHref={`/analytics/${projectId}/app/${appId}/dashboards`}
      />
      <div className="flex-1">
        <AppLayout
          onToolsChange={(e) => {
            if (state?.helpPanelType === HelpPanelType.NONE) {
              return;
            }
            if (!e.detail.open) {
              dispatch?.({ type: HelpInfoActionType.HIDE_HELP_PANEL });
            } else {
              dispatch?.({
                type: HelpInfoActionType.SHOW_HELP_PANEL,
                payload: state?.helpPanelType,
              });
            }
          }}
          toolsOpen={state?.showHelpPanel}
          tools={<HelpInfo />}
          navigationHide
          content={<AnalyticsDashboardCard />}
          breadcrumbs={<CustomBreadCrumb breadcrumbItems={breadcrumbItems} />}
          headerSelector="#header"
        />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
