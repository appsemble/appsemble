import { type OpenAPIV3 } from 'openapi-types';

export const delimiter: OpenAPIV3.ParameterObject = {
  name: 'delimiter',
  in: 'query',
  description: `
Delimiter to be used to parse the CSV file
  `,
  schema: { type: 'string' },
};
