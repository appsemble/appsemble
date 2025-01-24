import { type OpenAPIV3 } from 'openapi-types';

import { FlowBackActionDefinition } from '../../api/components/schemas/FlowBackActionDefinition.js';
import { FlowCancelActionDefinition } from '../../api/components/schemas/FlowCancelActionDefinition.js';
import { FlowFinishActionDefinition } from '../../api/components/schemas/FlowFinishActionDefinition.js';
import { FlowNextActionDefinition } from '../../api/components/schemas/FlowNextActionDefinition.js';
import { FlowToActionDefinition } from '../../api/components/schemas/FlowToActionDefinition.js';

export const flowActions: Record<string, OpenAPIV3.SchemaObject> = {
  'flow.next': FlowNextActionDefinition,
  'flow.finish': FlowFinishActionDefinition,
  'flow.back': FlowBackActionDefinition,
  'flow.cancel': FlowCancelActionDefinition,
  'flow.to': FlowToActionDefinition,
};
