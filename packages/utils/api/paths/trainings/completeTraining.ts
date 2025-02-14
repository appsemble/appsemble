import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  post: {
    description: 'Sets the status of this training to "completed" for this user',
    operationId: 'completeTraining',
    parameters: [
      {
        in: 'path',
        name: 'trainingId',
        schema: { type: 'string' },
        required: true,
        description: 'The ID of the training to complete',
      },
    ],
    responses: { 201: { description: 'Training successfully set to "completed"' } },
    security: [{ studio: [] }],
  },
};
