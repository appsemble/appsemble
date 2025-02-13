import { type OpenAPIV3 } from 'openapi-types';

export const TrainingCompleted: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'Object which stores that a user has completed a certain training',
  additionalProperties: false,
  properties: {
    trainingId: {
      type: 'string',
      description: 'The training that the user has completed.',
      readOnly: true,
    },
    userId: {
      type: 'string',
      description: 'The user who completed the training',
    },
  },
};
