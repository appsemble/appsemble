import { type OpenAPIV3 } from 'openapi-types';

export const BaseActionDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  properties: {
    remapBefore: {},
    remapAfter: {},
    onSuccess: {},
    onError: {},
  },
};
