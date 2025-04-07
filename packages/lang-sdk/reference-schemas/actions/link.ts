import { type OpenAPIV3 } from 'openapi-types';

import { LinkActionDefinition } from '../../schemas/LinkActionDefinition.js';
import { LinkBackActionDefinition } from '../../schemas/LinkBackActionDefinition.js';
import { LinkNextActionDefinition } from '../../schemas/LinkNextActionDefinition.js';

export const linkActions: Record<string, OpenAPIV3.SchemaObject> = {
  link: LinkActionDefinition,
  'link.back': LinkBackActionDefinition,
  'link.next': LinkNextActionDefinition,
};
