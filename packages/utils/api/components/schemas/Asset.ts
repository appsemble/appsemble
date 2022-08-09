import { OpenAPIV3 } from 'openapi-types';

import { normalized } from '../../../constants/index.js';

export const Asset: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'The response object of an asset create call.',
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      readOnly: true,
      description: 'The unique identifier for the asset.',
      pattern: normalized.source,
    },
    mime: {
      type: 'string',
      readOnly: true,
      description: 'The IANA MIME type of the asset.',
    },
    filename: {
      type: 'string',
      readOnly: true,
      description: 'The filename of the asset.',
    },
    name: {
      type: 'string',
      pattern: normalized.source,
      description:
        'The given name of the asset. Assets may be referenced by their name or ID in the API.',
    },
  },
};
