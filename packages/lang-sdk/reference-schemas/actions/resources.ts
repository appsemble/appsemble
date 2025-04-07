import { type OpenAPIV3 } from 'openapi-types';

import {
  ResourceCountActionDefinition,
  ResourceCreateActionDefinition,
  ResourceDeleteActionDefinition,
  ResourceDeleteAllActionDefinition,
  ResourceDeleteBulkActionDefinition,
  ResourceGetActionDefinition,
  ResourceHistoryGetActionDefinition,
  ResourcePatchActionDefinition,
  ResourceQueryActionDefinition,
  ResourceSubscriptionStatusActionDefinition,
  ResourceSubscriptionSubscribeActionDefinition,
  ResourceSubscriptionToggleActionDefinition,
  ResourceSubscriptionUnsubscribeActionDefinition,
  ResourceUpdateActionDefinition,
  ResourceUpdatePositionsActionDefinition,
} from '../../schemas/index.js';

export const resourceActions: Record<string, OpenAPIV3.SchemaObject> = {
  'resource.get': ResourceGetActionDefinition,
  'resource.history.get': ResourceHistoryGetActionDefinition,
  'resource.update.positions': ResourceUpdatePositionsActionDefinition,
  'resource.query': ResourceQueryActionDefinition,
  'resource.count': ResourceCountActionDefinition,
  'resource.create': ResourceCreateActionDefinition,
  'resource.update': ResourceUpdateActionDefinition,
  'resource.patch': ResourcePatchActionDefinition,
  'resource.delete': ResourceDeleteActionDefinition,
  'resource.delete.all': ResourceDeleteAllActionDefinition,
  'resource.delete.bulk': ResourceDeleteBulkActionDefinition,
  'resource.subscription.subscribe': ResourceSubscriptionSubscribeActionDefinition,
  'resource.subscription.unsubscribe': ResourceSubscriptionUnsubscribeActionDefinition,
  'resource.subscription.toggle': ResourceSubscriptionToggleActionDefinition,
  'resource.subscription.status': ResourceSubscriptionStatusActionDefinition,
};
