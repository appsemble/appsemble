import { AppPermission } from '@appsemble/types';
import { type OpenAPIV3 } from 'openapi-types';

export const SecurityGuestDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'This describes a security role.',
  additionalProperties: false,
  properties: {
    permissions: {
      type: 'array',
      minItems: 1,
      description: 'Specific permissions within the app, which this role should have',
      items: {
        oneOf: [
          {
            enum: [Object.values(AppPermission)],
          },
          {
            type: 'string',
          },
        ],
      },
    },
  },
};
