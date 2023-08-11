import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/quotas/email': {
    get: {
      tags: ['app'],
      operationId: 'getAppEmailQuota',
      parameters: [{ $ref: '#/components/parameters/appId' }],
      security: [{ studio: [] }, {}],
      responses: {
        200: {
          description: 'Email quota for an app',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  used: {
                    type: 'number',
                    description: 'Number of emails sent today',
                  },
                  limit: {
                    type: 'number',
                    description: 'Maximum number of emails that can be sent today',
                  },
                  reset: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Date and time when the quota resets',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
