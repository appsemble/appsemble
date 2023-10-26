import { type OpenAPIV3 } from 'openapi-types';

export const trainingId: OpenAPIV3.ParameterObject = {
  name: 'trainingId',
  in: 'path',
  description: 'Id of the training on which the operation will be performed.',
  required: true,
  schema: { $ref: '#/components/schemas/Training/properties/id' },
};
