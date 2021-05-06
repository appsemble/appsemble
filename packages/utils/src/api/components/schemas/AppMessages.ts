import { OpenAPIV3 } from 'openapi-types';

import { partialNormalized, semver } from '../../../constants';

export const AppMessages: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'The response object of an messages create call.',
  required: ['language', 'messages'],
  properties: {
    language: { type: 'string', description: 'The language the messages represent.' },
    messages: {
      type: 'object',
      description: 'A mapping of the messages for this language',
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
    },
    force: {
      type: 'boolean',
      writeOnly: true,
      description: 'If this is true, the app lock is ignored.',
    },
  },
};
