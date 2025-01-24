import { type OpenAPIV3 } from 'openapi-types';

import { ResourceCountActionDefinition } from '../../api/components/schemas/ResourceCountActionDefinition.js';
import { ResourceCreateActionDefinition } from '../../api/components/schemas/ResourceCreateActionDefinition.js';
import { ResourceDeleteActionDefinition } from '../../api/components/schemas/ResourceDeleteActionDefinition.js';
import { ResourceGetActionDefinition } from '../../api/components/schemas/ResourceGetActionDefinition.js';
import { ResourceHistoryGetActionDefinition } from '../../api/components/schemas/ResourceHistoryGetActionDefinition.js';
import { ResourcePatchActionDefinition } from '../../api/components/schemas/ResourcePatchActionDefinition.js';
import { ResourceQueryActionDefinition } from '../../api/components/schemas/ResourceQueryActionDefinition.js';
import { ResourceSubscriptionStatusActionDefinition } from '../../api/components/schemas/ResourceSubscriptionStatusActionDefinition.js';
import { ResourceSubscriptionSubscribeActionDefinition } from '../../api/components/schemas/ResourceSubscriptionSubscribeActionDefinition.js';
import { ResourceSubscriptionToggleActionDefinition } from '../../api/components/schemas/ResourceSubscriptionToggleActionDefinition.js';
import { ResourceSubscriptionUnsubscribeActionDefinition } from '../../api/components/schemas/ResourceSubscriptionUnsubscribeActionDefinition.js';
import { ResourceUpdateActionDefinition } from '../../api/components/schemas/ResourceUpdateActionDefinition.js';

export const resourceActions: Record<string, OpenAPIV3.SchemaObject> = {
  'resource.get': ResourceGetActionDefinition,
  'resource.history.get': ResourceHistoryGetActionDefinition,
  'resource.query': ResourceQueryActionDefinition,
  'resource.count': ResourceCountActionDefinition,
  'resource.create': ResourceCreateActionDefinition,
  'resource.update': ResourceUpdateActionDefinition,
  'resource.patch': ResourcePatchActionDefinition,
  'resource.delete': ResourceDeleteActionDefinition,
  'resource.subscription.subscribe': ResourceSubscriptionSubscribeActionDefinition,
  'resource.subscription.unsubscribe': ResourceSubscriptionUnsubscribeActionDefinition,
  'resource.subscription.toggle': ResourceSubscriptionToggleActionDefinition,
  'resource.subscription.status': ResourceSubscriptionStatusActionDefinition,
};
