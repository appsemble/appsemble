import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  get: {
    tags: ['main', 'user'],
    description: 'Get a list of active and verified users subscribed to the appsemble newsletter',
    operationId: 'getSubscribedUsers',
    responses: {
      200: { description: 'List of subscribed users' },
      401: { description: 'Invalid or missing admin API secret' },
    },
  },
};
