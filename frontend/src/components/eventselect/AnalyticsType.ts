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

import { SelectProps } from '@cloudscape-design/components';
import {
  ConditionCategory,
  MetadataSource,
  MetadataValueType,
} from 'ts/explore-types';

export interface IConditionItemType {
  eventType: string;
  conditionOption: IAnalyticsItem | null;
  conditionOperator: SelectProps.Option | null;
  conditionValue: string[];
}

export interface SegmentationFilterDataType {
  enableChangeRelation?: boolean;
  conditionRelationShip: ERelationShip;
  conditionOptions: CategoryItemType[];
  data: IConditionItemType[];
}

export interface IAnalyticsItem extends SelectProps.Option {
  name?: string;
  modifyTime?: string;
  metadataSource?: MetadataSource;
  category?: ConditionCategory;
  valueType?: MetadataValueType;
  values?: IMetadataAttributeValue[];
}

export interface CategoryItemType {
  categoryName: string;
  categoryType: string;
  itemList: IAnalyticsItem[];
}

export enum ERelationShip {
  AND = 'and',
  OR = 'or',
}
export interface IEventAnalyticsItem {
  listOrderType?: 'number' | 'alphabet';
  customOrderName?: string;
  selectedEventOption: IAnalyticsItem | null;
  selectedEventAttributeOption: CategoryItemType[];
  calculateMethodOption?: SelectProps.Option | null;
  conditionOptions: CategoryItemType[];
  conditionList: IConditionItemType[];
  conditionRelationShip: ERelationShip;
  hasTab?: boolean;
  isMultiSelect?: boolean;
  enableChangeRelation?: boolean;
}

export interface IRetentionAnalyticsItem {
  startEventOption: IAnalyticsItem | null;
  revisitEventOption: IAnalyticsItem | null;
  startConditionOptions: CategoryItemType[];
  startConditionList: IConditionItemType[];
  startConditionRelationShip: ERelationShip;
  revisitConditionOptions: CategoryItemType[];
  revisitConditionList: IConditionItemType[];
  revisitConditionRelationShip: ERelationShip;
  startEventRelationAttributeOptions: CategoryItemType[] | null;
  revisitEventRelationAttributeOptions: CategoryItemType[] | null;
  startEventRelationAttribute: IAnalyticsItem | null;
  revisitEventRelationAttribute: IAnalyticsItem | null;
  showRelation: boolean;
}

export const DEFAULT_EVENT_ITEM = {
  selectedEventOption: null,
  calculateMethodOption: null,
  selectedEventAttributeOption: [],
  conditionOptions: [],
  conditionList: [],
  conditionRelationShip: ERelationShip.AND,
  hasTab: true,
  isMultiSelect: true,
  enableChangeRelation: false,
};

export const DEFAULT_RETENTION_ITEM = {
  startEventOption: null,
  revisitEventOption: null,
  startConditionOptions: [],
  startConditionList: [],
  startConditionRelationShip: ERelationShip.AND,
  revisitConditionOptions: [],
  revisitConditionList: [],
  revisitConditionRelationShip: ERelationShip.AND,
  startEventRelationAttributeOptions: null,
  revisitEventRelationAttributeOptions: null,
  startEventRelationAttribute: null,
  revisitEventRelationAttribute: null,
  showRelation: false,
};

export const INIT_EVENT_LIST: IEventAnalyticsItem[] = [DEFAULT_EVENT_ITEM];

export const DEFAULT_CONDITION_DATA: IConditionItemType = {
  eventType: 'attribute',
  conditionOption: null,
  conditionOperator: null,
  conditionValue: [],
};

export const DEFAULT_SEGMENTATION_DATA: IConditionItemType = {
  eventType: 'event',
  conditionOption: null,
  conditionOperator: null,
  conditionValue: [],
};

export const INIT_SEGMENTATION_DATA: SegmentationFilterDataType = {
  enableChangeRelation: true,
  conditionOptions: [],
  conditionRelationShip: ERelationShip.AND,
  data: [DEFAULT_SEGMENTATION_DATA],
};
