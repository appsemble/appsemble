import { type OpenAPIV3 } from 'openapi-types';

export const AppCollectionDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'An app collection',
  additionalProperties: false,
  properties: {
    name: {
      type: 'string',
      description: 'The name of the app collection.',
      minLength: 1,
      maxLength: 30,
    },
    visibility: {
      enum: ['private', 'public'],
      description: 'The visibility of the app collection.',
    },
    expertName: {
      type: 'string',
      description: 'The name of the app collection’s expert/curator.',
      minLength: 1,
      maxLength: 30,
    },
    expertDescription: {
      type: 'string',
      description: 'The description of the app collection’s expert/curator.',
      maxLength: 4000,
    },
    expertProfileImage: {
      type: 'string',
      format: 'binary',
      description: 'The profile image of the app collection’s expert/curator.',
    },
    headerImage: {
      type: 'string',
      format: 'binary',
      description: 'The header image of the app collection.',
    },
  },
};
