import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  delete: {
    tags: ['main', 'app'],
    description: 'Delete the current app’s maskable icon.',
    operationId: 'deleteAppMaskableIcon',
    responses: {
      204: {
        description: 'The icon has been successfully removed',
      },
    },
    security: [{ studio: [] }, { cli: ['apps:write'] }],
  },
};
