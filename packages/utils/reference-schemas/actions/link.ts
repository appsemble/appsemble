import { type OpenAPIV3 } from 'openapi-types';

import { LinkActionDefinition } from '../../api/components/schemas/LinkActionDefinition.js';
import { LinkBackActionDefinition } from '../../api/components/schemas/LinkBackActionDefinition.js';
import { LinkNextActionDefinition } from '../../api/components/schemas/LinkNextActionDefinition.js';

export const linkActions: Record<string, OpenAPIV3.SchemaObject> = {
  link: LinkActionDefinition,
  'link.back': LinkBackActionDefinition,
  'link.next': LinkNextActionDefinition,
};
