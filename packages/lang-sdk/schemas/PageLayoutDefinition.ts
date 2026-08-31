import { ResponsiveGridLayoutDefinition } from './ResponsiveGridLayoutDefinition.js';
import { extendJSONSchema } from './utils/extendJSONSchema.js';

export const PageLayoutDefinition = extendJSONSchema(ResponsiveGridLayoutDefinition, {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  description: 'Responsive grid layout for a page',
});
