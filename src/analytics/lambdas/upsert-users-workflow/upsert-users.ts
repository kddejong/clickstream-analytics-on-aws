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

import { logger } from '../../../common/powertools';
import { UpsertUsersBody } from '../../private/model';
import { getRedshiftClient, executeStatements, getRedshiftProps } from '../redshift-data';

const REDSHIFT_DATA_API_ROLE_ARN = process.env.REDSHIFT_DATA_API_ROLE!;
const REDSHIFT_DATABASE = process.env.REDSHIFT_DATABASE!;

// Create an Amazon service client object.
const redshiftDataApiClient = getRedshiftClient(REDSHIFT_DATA_API_ROLE_ARN);

export interface UpsertUsersEvent {
  detail: UpsertUsersBody;
}

/**
 * The lambda function submit a SQL statement to upsert users.
 * @param event ScheduleEvent, the JSON format is as follows:
 {
    "detail": {
      "app_id": app1
    }
  }
  @returns The query_id and relevant properties.
 */
export const handler = async (event: UpsertUsersEvent) => {
  const redshiftProps = getRedshiftProps(
    process.env.REDSHIFT_MODE!,
    REDSHIFT_DATABASE,
    REDSHIFT_DATA_API_ROLE_ARN,
    process.env.REDSHIFT_DB_USER!,
    process.env.REDSHIFT_SERVERLESS_WORKGROUP_NAME!,
    process.env.REDSHIFT_CLUSTER_IDENTIFIER!,
  );

  const schema = event.detail.appId;
  const sqlStatements : string[] = [];
  sqlStatements.push(`CALL ${schema}.sp_upsert_users()`);

  try {
    const queryId = await executeStatements(
      redshiftDataApiClient, sqlStatements, redshiftProps.serverlessRedshiftProps, redshiftProps.provisionedRedshiftProps);

    logger.info('Upsert users response:', { queryId });
    return {
      detail: {
        appId: schema,
        id: queryId,
      },
    };

  } catch (err) {
    if (err instanceof Error) {
      logger.error('Error when upsert users.', err);
    }
    throw err;
  }
};