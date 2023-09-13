import { type OpenAPIV3 } from 'openapi-types';

export const AppCollection: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'An app collection',
  additionalProperties: false,
  properties: {
    id: {
      type: 'integer',
      readOnly: true,
      description: 'The unique ID of the app collection.',
    },
    name: {
      type: 'string',
      description: 'The name of the app collection.',
    },
    OrganizationId: {
      type: 'string',
      description: 'The ID of the organization that owns the app collection.',
    },
    OrganizationName: {
      type: 'string',
      description: 'The name of the organization that owns the app collection.',
    },
    visibility: {
      enum: ['private', 'public'],
      description: 'The visibility of the app collection.',
    },
    $expert: {
      type: 'object',
      additionalProperties: false,
      description: 'The app collection’s expert/curator.',
      properties: {
        name: {
          type: 'string',
          description: 'The name of the expert.',
        },
        description: {
          type: 'string',
          description: 'The description of the expert.',
        },
        profileImage: {
          type: 'string',
          description: 'The URL at which the expert’s profile image can be found.',
        },
      },
    },
    headerImage: {
      type: 'string',
      description: 'The URL at which the app collection’s header image can be found.',
    },
    $created: {
      type: 'string',
      format: 'date-time',
      description: 'When the collection was first created as an ISO 8601 formatted string',
    },
    $updated: {
      type: 'string',
      format: 'date-time',
      description: 'When the collection was last updated as an ISO 8601 formatted string',
    },
  },
};
