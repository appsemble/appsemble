import { OpenAPIV3 } from 'openapi-types';

import { normalized } from '../../../constants/index.js';

export const Organization: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'An organization groups a set of users, apps, themes, and permissions together',
  required: ['id'],
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      pattern: normalized.source,
      minLength: 1,
      maxLength: 30,
      description: 'The unique identifier for the organization.',
    },
    name: {
      type: 'string',
      description: 'The display name for the organization.',
    },
    description: {
      type: 'string',
      description: 'The description of the organization.',
      maxLength: 160,
    },
    email: {
      type: 'string',
      description: 'The email address of the organization.',
    },
    website: {
      type: 'string',
      description: 'The website of the organization.',
    },
    iconUrl: {
      type: 'string',
      description: 'The URL used to fetch the organization’s icon.',
    },
  },
};
