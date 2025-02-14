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

import { IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { RedshiftOdsTables } from '../analytics-on-redshift';

export interface LoadDataProps {
  readonly scheduleInterval: string;
  readonly maxFilesLimit: number;
}


export interface TablesLoadDataProps {
  readonly ods_events: LoadDataProps;
  readonly event: LoadDataProps;
  readonly event_parameter: LoadDataProps;
  readonly user: LoadDataProps;
  readonly item: LoadDataProps;
}

interface BucketInfo {
  readonly s3Bucket: IBucket;
  readonly prefix: string;
}

export type ODSSource = BucketInfo & {
  readonly fileSuffix: string;
}

export interface TablesODSSource {
  readonly ods_events: ODSSource;
  readonly event: ODSSource;
  readonly event_parameter: ODSSource;
  readonly user: ODSSource;
  readonly item: ODSSource;
}

export type LoadWorkflowData = BucketInfo;

export interface TablesLoadWorkflowData {
  readonly ods_events: LoadWorkflowData;
  readonly event: LoadWorkflowData;
  readonly event_parameter: LoadWorkflowData;
  readonly user: LoadWorkflowData;
  readonly item: LoadWorkflowData;
}

export type UpsertUsersWorkflowData = {
  readonly scheduleExpression: string;
}

export type ScanMetadataWorkflowData = {
  readonly scheduleExpression: string;
  readonly clickstreamAnalyticsMetadataDdbArn: string;
  readonly topFrequentPropertiesLimit: string;
}

export type ClearExpiredEventsWorkflowData = {
  readonly scheduleExpression: string;
  readonly retentionRangeDays: number;
}

interface RedshiftProps {
  readonly databaseName: string;
}

export interface RedshiftServerlessProps extends RedshiftProps {
  readonly workgroupName: string;
}

export interface NewRedshiftServerlessProps extends RedshiftServerlessProps {
  readonly vpcId: string;
  readonly subnetIds: string;
  readonly securityGroupIds: string;
  readonly baseCapacity: number;
}
export interface ExistingRedshiftServerlessProps extends RedshiftServerlessProps {
  readonly workgroupId?: string;
  readonly namespaceId?: string;
  readonly dataAPIRoleArn: string;
  readonly createdInStack: boolean;
}

export interface ProvisionedRedshiftProps extends RedshiftProps {
  readonly clusterIdentifier: string;
  readonly dbUser: string;
}

export type ExistingRedshiftServerlessCustomProps = Omit<ExistingRedshiftServerlessProps, 'createdInStack'>;
interface CustomProperties {
  readonly serverlessRedshiftProps?: ExistingRedshiftServerlessCustomProps;
  readonly provisionedRedshiftProps?: ProvisionedRedshiftProps;
}

export type SQLDef = {
  readonly updatable: 'true' | 'false';
  readonly sqlFile: string;
  readonly multipleLine?: 'true' | 'false';
}

export type CreateDatabaseAndSchemas = CustomProperties & {
  readonly projectId: string;
  readonly appIds: string;
  readonly odsTableNames: RedshiftOdsTables;
  readonly databaseName: string;
  readonly dataAPIRole: string;
  readonly redshiftBIUserParameter: string;
  readonly redshiftBIUsernamePrefix: string;
  readonly reportingViewsDef: SQLDef[];
  readonly schemaDefs: SQLDef[];
}
export type CreateMappingRoleUser = Omit<CustomProperties, 'provisionedRedshiftProps'> & {
  readonly dataRoleName: string;
}

export type AssociateIAMRoleToRedshift = CustomProperties & {
  readonly roleArn: string;
}

export interface NewWorkgroupProperties {
  readonly workgroupName: string;
  readonly baseCapacity: number;
  readonly namespaceName: string;
  readonly securityGroupIds: string[];
  readonly subnetIds: string[];
  readonly publiclyAccessible: false;
}
export interface RedshiftServerlessWorkgroupProps {
  readonly vpc: IVpc;
  readonly subnetSelection: SubnetSelection;
  readonly securityGroupIds: string;
  readonly baseCapacity: number;
  readonly workgroupName: string;
  readonly databaseName: string;
  readonly projectId: string;
}
export type NewNamespaceCustomProperties = RedshiftProps & {
  readonly adminRoleArn: string;
  readonly namespaceName: string;
}

export interface ManifestItem {
  readonly url: string;
  readonly meta: {
    readonly content_length: number;
  };
}

export interface ManifestBody {
  readonly appId: string;
  readonly manifestFileName: string;
  readonly jobList: {
    readonly entries: Array<ManifestItem>;
  };
}

export interface UpsertUsersBody {
  readonly appId: string;
}

export interface ScanMetadataBody {
  readonly appId: string;
}

export interface StoreMetadataBody {
  readonly appId: string;
}

export type CheckUpsertStatusEventDetail = {
  id: string;
  appId: string;
  status: string;
}

export type CheckScanMetadataStatusEventDetail = {
  id: string;
  appId: string;
  status: string;
}

export interface ClearExpiredEventsBody {
  readonly appId: string;
  readonly retentionRangeDays: number;
}

export type ClearExpiredEventsEventDetail = {
  id: string;
  appId: string;
  status: string;
}

export type MustacheParamBaseType = {
  [key: string]: string;
}

export type MustacheParamType = {
  database_name: string;
  schema: string;
  table_ods_events: string;
  table_event: string;
  table_event_parameter: string;
  table_user: string;
  table_item: string;
  sp_upsert_users: string;
  sp_scan_metadata: string;
  table_ods_users: string;
  table_dim_users: string;
  sp_clickstream_log: string;
  sp_clickstream_log_non_atomic: string;
  table_clickstream_log: string;
  user_bi?: string;
}