import { OpenAPIV3 } from 'openapi-types';

export const TabsPageDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  allOf: [
    { $ref: '#/components/schemas/BasePageDefinition' },
    {
      type: 'object',
      description: 'This describes what a page will look like in the app.',
      required: ['name', 'type', 'subPages'],
      properties: {
        type: {
          type: 'string',
          enum: ['tabs'],
        },
        subPages: {
          type: 'array',
          minItems: 1,
          description: "Sub pages belonging to this page's flow.",
          items: {
            $ref: '#/components/schemas/SubPage',
          },
        },
      },
    },
  ],
};
