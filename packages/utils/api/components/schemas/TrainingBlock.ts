import { type OpenAPIV3 } from 'openapi-types';

export const TrainingBlock: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: '',
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      description: 'The id of the Training Block, will be generated automatically by the system.',
      readOnly: true,
    },
    trainingId: {
      type: 'number',
      minimum: 0,
      description: 'Id of the parent training.',
    },
    title: {
      type: 'string',
      description: 'Title of the training block.',
    },
    documentationLink: {
      type: 'string',
      description: 'A URL pointing to a page in the documentation.',
    },
    videoLink: {
      type: 'string',
      description: 'Link of the video associated with the training block.',
    },
    exampleCode: {
      type: 'string',
      description: 'Example code for the user to be copied.',
    },
    externalResource: {
      type: 'string',
      description: 'Link to any external resource.',
    },
  },
};
