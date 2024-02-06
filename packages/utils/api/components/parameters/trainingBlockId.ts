import { type OpenAPIV3 } from 'openapi-types';

export const trainingBlockId: OpenAPIV3.ParameterObject = {
  name: 'trainingBlockId',
  in: 'path',
  description: 'Id of the trainingBlock on which the operation will be performed.',
  required: true,
  schema: { $ref: '#/components/schemas/TrainingBlock/properties/id' },
};
