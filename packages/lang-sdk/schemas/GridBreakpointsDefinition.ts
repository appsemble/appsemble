import { type OpenAPIV3 } from 'openapi-types';

export const GridBreakpointsDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: `Minimum viewport widths in pixels at which the tablet and desktop grid layouts apply.

The mobile layout always applies from a width of 0. Each breakpoint must be smaller than the next.
`,
  additionalProperties: false,
  minProperties: 1,
  properties: {
    tablet: {
      type: 'integer',
      minimum: 0,
      description: 'Minimum viewport width in pixels at which the tablet grid layout applies.',
    },
    desktop: {
      type: 'integer',
      minimum: 0,
      description: 'Minimum viewport width in pixels at which the desktop grid layout applies.',
    },
  },
};
