import { type OpenAPIV3 } from 'openapi-types';

import { partialNormalized, semver } from '../../../constants/index.js';

export const AppsembleMessages: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'A mapping of the messages for this language',
  additionalProperties: false,
  properties: {
    core: {
      type: 'object',
      description: 'Translations for the core of the app.',
      additionalProperties: { type: 'string' },
    },
    app: {
      type: 'object',
      description: 'Translations for global block messages and meta properties of the app.',
      additionalProperties: { type: 'string' },
    },
    blocks: {
      type: 'object',
      description: 'Translations for the core of the app.',
      additionalProperties: {
        type: 'object',
        description: 'The name of the block type.',
        pattern: `^@${partialNormalized.source}/${partialNormalized.source}$`,
        additionalProperties: {
          type: 'object',
          description: 'The version of the block.',
          pattern: semver.source,
          additionalProperties: { type: 'string' },
        },
      },
    },
    messageIds: {
      type: 'object',
      description: 'A list of custom message IDs used by the app.',
      additionalProperties: { type: 'string' },
    },
  },
};
