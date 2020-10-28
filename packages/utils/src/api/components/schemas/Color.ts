import { OpenAPIV3 } from 'openapi-types';

export const Color: OpenAPIV3.NonArraySchemaObject = {
  description: 'A hexadecimal rgb color code without an alpha layer.',
  type: 'string',
  pattern: /^#[\dA-Fa-f]{6}$/.source,
  example: '#00a43b',
};
