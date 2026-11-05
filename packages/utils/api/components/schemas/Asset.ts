import { type OpenAPIV3 } from 'openapi-types';

import { normalized } from '../../../constants/index.js';

export const Asset: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'The response object of an asset publish call.',
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
    seed: {
      type: 'boolean',
      readOnly: true,
      description: 'Whether the asset is a seed asset.',
    },
    clonable: {
      type: 'boolean',
      readOnly: true,
      description: 'Whether the asset is transferred when cloning the app.',
    },
    sha256: {
      type: 'string',
      nullable: true,
      readOnly: true,
      description: 'The hex encoded SHA-256 hash of the asset content.',
    },
  },
};
