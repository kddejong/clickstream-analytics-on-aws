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

import { Button } from '@cloudscape-design/components';
import { getUserDetails } from 'apis/user';
import Axios from 'axios';
import Loading from 'components/common/Loading';
import RoleRoute from 'components/common/RoleRoute';
import CommonAlert from 'components/common/alert';
import { AppContext } from 'context/AppContext';
import { GlobalProvider } from 'context/StateContext';
import { UserContext } from 'context/UserContext';
import { WebStorageStateStore } from 'oidc-client-ts';
import AlarmsList from 'pages/alarms/AlarmList';
import AnalyticsHome from 'pages/analytics/AnalyticsHome';
import AnalyticsAnalyzes from 'pages/analytics/analyzes/AnalyticsAnalyzes';
import AnalyticsDashboard from 'pages/analytics/dashboard/AnalyticsDashboard';
import AnalyticsDashboardDetail from 'pages/analytics/dashboard/detail/AnalyticsDashboardDetail';
import AnalyticsDataManagement from 'pages/analytics/data-management/AnalyticsDataManagement';
import AnalyticsExplore from 'pages/analytics/explore/AnalyticsExplore';
import AnalyticsRealtime from 'pages/analytics/realtime/AnalyticsRealtime';
import CreateApplication from 'pages/application/create/CreateApplication';
import ApplicationDetail from 'pages/application/detail/ApplicationDetail';
import CreatePipeline from 'pages/pipelines/create/CreatePipeline';
import PipelineDetail from 'pages/pipelines/detail/PipelineDetail';
import PluginList from 'pages/plugins/PluginList';
import CreatePlugin from 'pages/plugins/create/CreatePlugin';
import Projects from 'pages/projects/Projects';
import ProjectDetail from 'pages/projects/detail/ProjectDetail';
import UserList from 'pages/user/UserList';
import React, { Suspense, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthProvider, AuthProviderProps, useAuth } from 'react-oidc-context';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { CONFIG_URL, IUserRole, PROJECT_CONFIG_JSON } from 'ts/const';
import Home from './pages/home/Home';

const LoginCallback: React.FC = () => {
  const currentUser = useContext(UserContext);

  useEffect(() => {
    const baseUrl = '/';
    if (currentUser?.role === IUserRole.ANALYST) {
      window.location.href = `${baseUrl}analytics`;
    } else {
      window.location.href = baseUrl;
    }
  }, []);
  return <Loading isPage />;
};

const SignedInPage: React.FC = () => {
  const auth = useAuth();
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState<IUser>();

  useEffect(() => {
    // the `return` is important - addAccessTokenExpiring() returns a cleanup function
    return auth?.events?.addAccessTokenExpiring((event) => {
      auth.signinSilent();
    });
  }, [auth.events, auth.signinSilent]);

  const getCurrentUser = async () => {
    if (!auth.user?.profile.email) {
      return;
    }
    try {
      const { success, data }: ApiResponse<IUser> = await getUserDetails(
        auth.user?.profile.email
      );
      if (success) {
        setCurrentUser(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    (async () => {
      await getCurrentUser();
    })();
  }, [auth]);

  if (auth.isLoading || (auth.isAuthenticated && !currentUser)) {
    return <Loading isPage />;
  }

  if (auth.error) {
    return (
      <div className="text-center pd-20">
        {t('oops')} {auth.error.message}
      </div>
    );
  }

  if (auth.isAuthenticated) {
    return (
      <UserContext.Provider value={currentUser}>
        <Router>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/signin" element={<LoginCallback />} />
              <Route
                path="/"
                element={
                  <RoleRoute
                    layout="common"
                    auth={auth}
                    roles={[IUserRole.ADMIN, IUserRole.OPERATOR]}
                  >
                    <Home />
                  </RoleRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <RoleRoute
                    layout="common"
                    auth={auth}
                    roles={[IUserRole.ADMIN, IUserRole.OPERATOR]}
                  >
                    <Projects />
                  </RoleRoute>
                }
              />
              <Route
                path="/alarms"
                element={
                  <RoleRoute
                    layout="common"
                    auth={auth}
                    roles={[IUserRole.ADMIN, IUserRole.OPERATOR]}
                  >
                    <AlarmsList />
                  </RoleRoute>
                }
              />
              <Route
                path="/user"
                element={
                  <RoleRoute
                    layout="common"
                    auth={auth}
                    roles={[IUserRole.ADMIN]}
                  >
                    <UserList />
                  </RoleRoute>
                }
              />
              <Route
                path="/project/detail/:id"
                element={
                  <RoleRoute
                    layout="common"
                    auth={auth}
                    roles={[IUserRole.ADMIN, IUserRole.OPERATOR]}
                  >
                    <ProjectDetail />
                  </RoleRoute>
                }
              />
              <Route
                path="/project/:pid/pipeline/:id"
                element={
                  <RoleRoute
                    layout="common"
                    auth={auth}
                    roles={[IUserRole.ADMIN, IUserRole.OPERATOR]}
                  >
                    <PipelineDetail />
                  </RoleRoute>
                }
              />
              <Route
                path="/project/:pid/pipeline/:id/update"
                element={
                  <RoleRoute
                    layout="common"
                    auth={auth}
                    roles={[IUserRole.ADMIN, IUserRole.OPERATOR]}
                  >
                    <CreatePipeline update />
                  </RoleRoute>
                }
              />
              <Route
                path="/project/:projectId/pipelines/create"
                element={
                  <RoleRoute
                    layout="common"
                    auth={auth}
                    roles={[IUserRole.ADMIN, IUserRole.OPERATOR]}
                  >
                    <CreatePipeline />
                  </RoleRoute>
                }
              />
              <Route
                path="/pipelines/create"
                element={
                  <RoleRoute
                    layout="common"
                    auth={auth}
                    roles={[IUserRole.ADMIN, IUserRole.OPERATOR]}
                  >
                    <CreatePipeline />
                  </RoleRoute>
                }
              />
              <Route
                path="/project/:id/application/create"
                element={
                  <RoleRoute
                    layout="common"
                    auth={auth}
                    roles={[IUserRole.ADMIN, IUserRole.OPERATOR]}
                  >
                    <CreateApplication />
                  </RoleRoute>
                }
              />
              <Route
                path="/plugins"
                element={
                  <RoleRoute
                    layout="common"
                    auth={auth}
                    roles={[IUserRole.ADMIN, IUserRole.OPERATOR]}
                  >
                    <PluginList />
                  </RoleRoute>
                }
              />
              <Route
                path="/plugins/create"
                element={
                  <RoleRoute
                    layout="common"
                    auth={auth}
                    roles={[IUserRole.ADMIN, IUserRole.OPERATOR]}
                  >
                    <CreatePlugin />
                  </RoleRoute>
                }
              />
              <Route
                path="/project/:pid/application/detail/:id"
                element={
                  <RoleRoute
                    layout="common"
                    auth={auth}
                    roles={[IUserRole.ADMIN, IUserRole.OPERATOR]}
                  >
                    <ApplicationDetail />
                  </RoleRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <RoleRoute
                    layout="none"
                    auth={auth}
                    roles={[IUserRole.ADMIN, IUserRole.ANALYST]}
                  >
                    <AnalyticsHome auth={auth} />
                  </RoleRoute>
                }
              />
              <Route
                path="/analytics/:projectId/app/:appId/data-management"
                element={
                  <RoleRoute
                    layout="analytics"
                    auth={auth}
                    roles={[IUserRole.ADMIN, IUserRole.ANALYST]}
                  >
                    <AnalyticsDataManagement />
                  </RoleRoute>
                }
              />
              <Route
                path="/analytics/:projectId/app/:appId/realtime"
                element={
                  <RoleRoute
                    layout="analytics"
                    auth={auth}
                    roles={[IUserRole.ADMIN, IUserRole.ANALYST]}
                  >
                    <AnalyticsRealtime />
                  </RoleRoute>
                }
              />
              <Route
                path="/analytics/:projectId/app/:appId/explore"
                element={
                  <RoleRoute
                    layout="analytics"
                    auth={auth}
                    roles={[IUserRole.ADMIN, IUserRole.ANALYST]}
                  >
                    <AnalyticsExplore />
                  </RoleRoute>
                }
              />
              <Route
                path="/analytics/:projectId/app/:appId/analyzes"
                element={
                  <RoleRoute
                    layout="analytics"
                    auth={auth}
                    roles={[IUserRole.ADMIN, IUserRole.ANALYST]}
                  >
                    <AnalyticsAnalyzes />
                  </RoleRoute>
                }
              />
              <Route
                path="/analytics/:projectId/app/:appId/dashboards"
                element={
                  <RoleRoute
                    layout="analytics"
                    auth={auth}
                    roles={[IUserRole.ADMIN, IUserRole.ANALYST]}
                  >
                    <AnalyticsDashboard />
                  </RoleRoute>
                }
              />
              <Route
                path="/analytics/:projectId/app/:appId/dashboard/:dashboardId"
                element={
                  <RoleRoute
                    layout="analytics"
                    auth={auth}
                    roles={[IUserRole.ADMIN, IUserRole.ANALYST]}
                  >
                    <AnalyticsDashboardDetail />
                  </RoleRoute>
                }
              />
            </Routes>
          </Suspense>
          <CommonAlert />
        </Router>
      </UserContext.Provider>
    );
  }

  return (
    <div className="oidc-login">
      <div>
        <div className="title">{t('welcome')}</div>
      </div>
      {
        <div>
          <Button
            variant="primary"
            onClick={() => {
              auth.signinRedirect();
            }}
          >
            {t('button.signIn')}
          </Button>
        </div>
      }
    </div>
  );
};

const App: React.FC = () => {
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [oidcConfig, setOidcConfig] = useState<AuthProviderProps>();
  const [contextData, setContextData] = useState<ConfigType>();

  const initAuthentication = (configData: ConfigType) => {
    const settings = {
      userStore: new WebStorageStateStore({ store: window.localStorage }),
      authority: configData.oidc_provider,
      scope: 'openid email profile',
      automaticSilentRenew: true,
      client_id: configData.oidc_client_id,
      redirect_uri: configData.oidc_redirect_url,
    };
    setOidcConfig(settings);
  };

  const getConfig = async () => {
    const timeStamp = new Date().getTime();
    setLoadingConfig(true);
    // Get config
    const res = await Axios.get(`${CONFIG_URL}?timestamp=${timeStamp}`);
    const configData: ConfigType = res.data;
    if (!configData.oidc_logout_url) {
      // Get oidc logout url from openid configuration
      await Axios.get(
        `${configData.oidc_provider}/.well-known/openid-configuration`
      ).then((oidcRes) => {
        configData.oidc_logout_url = oidcRes.data.end_session_endpoint;
      });
    }
    setLoadingConfig(false);
    localStorage.setItem(PROJECT_CONFIG_JSON, JSON.stringify(configData));
    initAuthentication(configData);
    setContextData(configData);
  };

  const setLocalStorageAfterLoad = async () => {
    if (localStorage.getItem(PROJECT_CONFIG_JSON)) {
      const configData = JSON.parse(
        localStorage.getItem(PROJECT_CONFIG_JSON) ?? ''
      );
      setContextData(configData);
      initAuthentication(configData);
      setLoadingConfig(false);
    } else {
      await getConfig();
    }
  };

  useEffect(() => {
    const { type } = window.performance.getEntriesByType('navigation')[0];
    if (type === 'reload') {
      getConfig();
    } else {
      setLocalStorageAfterLoad();
    }
  }, []);

  return (
    <div className="App">
      {loadingConfig ? (
        <Loading isPage />
      ) : (
        <AuthProvider {...oidcConfig}>
          <AppContext.Provider value={contextData}>
            <GlobalProvider>
              <SignedInPage />
            </GlobalProvider>
          </AppContext.Provider>
        </AuthProvider>
      )}
    </div>
  );
};

export default App;
