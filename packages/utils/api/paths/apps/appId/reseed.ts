import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['main', 'app'],
    operationId: 'reseedDemoApp',
    responses: {
      200: { description: 'The app has successfully been reseeded.' },
    },
    security: [{ studio: ['apps:write'] }],
  },
};
