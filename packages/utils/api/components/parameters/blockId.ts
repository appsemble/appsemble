import { OpenAPIV3 } from 'openapi-types';

import { normalized } from '../../../constants/index.js';

export const blockId: OpenAPIV3.ParameterObject = {
  name: 'blockId',
  in: 'path',
  description:
    'The ID of the block on which to perform an operation, but without the organization scope.',
  required: true,
  schema: {
    type: 'string',
    pattern: normalized.source,
  },
};
