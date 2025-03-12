import { type OpenAPIV3 } from 'openapi-types';

export const webhookName: OpenAPIV3.ParameterObject = {
  name: 'webhookName',
  in: 'path',
  description: 'The name of the webhook to call',
  required: true,
  schema: {
    type: 'string',
  },
};
