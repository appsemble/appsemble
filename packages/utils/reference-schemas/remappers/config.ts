import { type OpenAPIV3 } from 'openapi-types';

import { schemaExample } from '../../examples.js';

export const configRemappers: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> = {
  variable: {
    type: 'string',
    description: `Get a predefined app variable by name

For example:

${schemaExample('variable', { exclude: ['input'] })}
`,
  },
};
