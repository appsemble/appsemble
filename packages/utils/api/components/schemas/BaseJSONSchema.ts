import { type OpenAPIV3 } from 'openapi-types';

export const BaseJSONSchema: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      minLength: 1,
      maxLength: 50,
      description: `A short title of the instance.

This is used in various places inside Appsemble Studio.
`,
    },
    description: {
      type: 'string',
      minLength: 1,
      maxLength: 5000,
      description: `A description of the instance.

This is used in various places inside Appsemble Studio.
`,
    },
  },
};
