import { type OpenAPIV3 } from 'openapi-types';

export const Training: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'Object representation of a training',
  additionalProperties: false,
  properties: {
    id: {
      type: 'number',
      readOnly: true,
      minimum: 0,
      description: 'The id of the training, will be generated automatically by the system.',
    },
    title: {
      type: 'string',
      description: 'Title of the training.',
    },
    description: {
      type: 'string',
      description: 'A brief overview of the training.',
    },
    competence: {
      type: 'string',
      description: 'Tag for the training',
    },
    difficultyLevel: {
      type: 'number',
      description: 'Difficulty level between 1 and 5',
      minimum: 1,
      maximum: 5,
    },
  },
};
