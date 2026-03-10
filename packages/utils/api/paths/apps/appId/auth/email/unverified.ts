import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  delete: {
    parameters: [
      {
        name: 'email',
        in: 'query',
        description: 'Emails to be removed',
        required: true,
        schema: { type: 'string' },
      },
    ],
    tags: ['delete', 'app', 'email', 'auth'],
    description: '',
    operationId: 'deleteCurrentAppMemberUnverifiedEmail',
    security: [{ app: ['email'] }],
    responses: {
      204: {
        description: 'Successfully removed email',
      },
    },
  },
};
