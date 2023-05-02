import { type OpenAPIV3 } from 'openapi-types';

export const language: OpenAPIV3.ParameterObject = {
  name: 'language',
  in: 'path',
  description: 'The language on which to perform an operation',
  required: true,
  schema: { type: 'string' },
};
