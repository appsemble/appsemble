import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/trainingBlockId' }],
  patch: {
    tags: ['main', 'training-block'],
    description: 'Update a training block with new content',
    operationId: 'patchTrainingBlock',
    requestBody: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              documentationLink: {
                $ref: '#/components/schemas/TrainingBlock/properties/documentationLink',
              },
              videoLink: { $ref: '#/components/schemas/TrainingBlock/properties/videoLink' },
              exampleCode: { $ref: '#/components/schemas/TrainingBlock/properties/exampleCode' },
              title: { $ref: '#/components/schemas/TrainingBlock/properties/title' },
              externalResource: {
                $ref: '#/components/schemas/TrainingBlock/properties/externalResource',
              },
            },
          },
        },
      },
    },
    responses: { 200: { $ref: '#/components/schemas/TrainingBlock' } },
    security: [{ studio: [] }],
  },
  delete: {
    tags: ['main', 'training-block'],
    description: 'Delete a training block by Id.',
    operationId: 'deleteTrainingBlock',
    responses: {
      204: { description: 'Deleted the specified training block.' },
    },
    security: [{ studio: [] }],
  },
};
