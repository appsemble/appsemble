import { ResponsiveGridLayoutDefinition } from './ResponsiveGridLayoutDefinition.js';
import { extendJSONSchema } from './utils/extendJSONSchema.js';

export const PageLayoutDefinition = extendJSONSchema(ResponsiveGridLayoutDefinition, {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  description: `Responsive grid layout for a page.

The \`breadcrumbs\` template area is reserved for the breadcrumb trail of the app. It requires
\`layout.breadcrumbs\`, has to be part of the grid every breakpoint renders, and has to be defined by
every sub page of a page or by none of them.
`,
});
