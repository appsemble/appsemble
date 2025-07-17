import { type OpenAPIV3 } from 'openapi-types';

import { FlowBackActionDefinition } from '../../schemas/actions/FlowBackActionDefinition.js';
import { FlowCancelActionDefinition } from '../../schemas/actions/FlowCancelActionDefinition.js';
import { FlowFinishActionDefinition } from '../../schemas/actions/FlowFinishActionDefinition.js';
import { FlowNextActionDefinition } from '../../schemas/actions/FlowNextActionDefinition.js';
import { FlowToActionDefinition } from '../../schemas/actions/FlowToActionDefinition.js';

export const flowActions: Record<string, OpenAPIV3.SchemaObject> = {
  'flow.next': FlowNextActionDefinition,
  'flow.finish': FlowFinishActionDefinition,
  'flow.back': FlowBackActionDefinition,
  'flow.cancel': FlowCancelActionDefinition,
  'flow.to': FlowToActionDefinition,
};
