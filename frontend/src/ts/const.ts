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
export const PROJECT_CONFIG_JSON = 'ClickStreamOnAWSConfigId';
export const CONFIG_URL = '/aws-exports.json';
export const COMMON_ALERT_TYPE = {
  Success: 'success',
  Error: 'error',
  Warning: 'warning',
  Info: 'info',
};

export const PROJECT_STAGE_LIST = [
  { label: 'Dev', value: 'Dev' },
  { label: 'Test', value: 'Test' },
  { label: 'Prod', value: 'Prod' },
];

export const PLUGIN_TYPE_LIST = [
  { label: 'Enrich', value: 'Enrich' },
  { label: 'Transform', value: 'Transform' },
];

export const PLUGINS_LIST = [
  {
    name: 'IP lookup',
    description: 'This enrichment uses MaxMind databases to lookup use...',
    status: 'Enabled',
    edited: 'Nov 24, 2022',
  },
  {
    name: 'UA parser',
    description: 'This enrichment uses the ua-parser library to parse the ...',
    status: 'Enabled',
    edited: 'Nov 24, 2022',
  },
  {
    name: 'Event fingerprint',
    description: 'This enrichment generates a fingerprint for the event ...',
    status: 'Enabled',
    edited: 'Nov 24, 2022',
  },
];

export const TRANSFORM_LIST = [
  {
    name: 'Transform user data template',
    description: 'This Transform template transform user information...',
    status: 'Enabled',
    edited: 'Nov 24, 2022',
  },
];

export enum ResourceCreateMehod {
  CREATE = 'create',
  EXSITING = 'exsiting',
}

export enum YES_NO {
  YES = 'Yes',
  NO = 'No',
}

export const YES_NO_LIST = [
  { value: YES_NO.YES, label: 'Yes' },
  { value: YES_NO.NO, label: 'No' },
];

export const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export enum SinkType {
  S3 = 's3',
  MSK = 'kafka',
  KDS = 'kinesis',
}

export enum ProtocalType {
  HTTP = 'HTTP',
  HTTPS = 'HTTPS',
}

export enum KDSProvisionType {
  ON_DEMAND = 'ON_DEMAND',
  PROVISIONED = 'PROVISIONED',
}
