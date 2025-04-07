import { type OpenAPIV3 } from 'openapi-types';

import { FlowBackActionDefinition } from '../../schemas/FlowBackActionDefinition.js';
import { FlowCancelActionDefinition } from '../../schemas/FlowCancelActionDefinition.js';
import { FlowFinishActionDefinition } from '../../schemas/FlowFinishActionDefinition.js';
import { FlowNextActionDefinition } from '../../schemas/FlowNextActionDefinition.js';
import { FlowToActionDefinition } from '../../schemas/FlowToActionDefinition.js';

export const flowActions: Record<string, OpenAPIV3.SchemaObject> = {
  'flow.next': FlowNextActionDefinition,
  'flow.finish': FlowFinishActionDefinition,
  'flow.back': FlowBackActionDefinition,
  'flow.cancel': FlowCancelActionDefinition,
  'flow.to': FlowToActionDefinition,
};
