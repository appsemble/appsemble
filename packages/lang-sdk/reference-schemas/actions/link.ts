import { type OpenAPIV3 } from 'openapi-types';

import { LinkActionDefinition } from '../../schemas/actions/LinkActionDefinition.js';
import { LinkBackActionDefinition } from '../../schemas/actions/LinkBackActionDefinition.js';
import { LinkNextActionDefinition } from '../../schemas/actions/LinkNextActionDefinition.js';

export const linkActions: Record<string, OpenAPIV3.SchemaObject> = {
  link: LinkActionDefinition,
  'link.back': LinkBackActionDefinition,
  'link.next': LinkNextActionDefinition,
};
