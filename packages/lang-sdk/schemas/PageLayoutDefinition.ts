import { ResponsiveGridLayoutDefinition } from './ResponsiveGridLayoutDefinition.js';
import { extendJSONSchema } from './utils/extendJSONSchema.js';

export const PageLayoutDefinition = extendJSONSchema(ResponsiveGridLayoutDefinition, {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  description: `Responsive grid layout for a page.

The \`breadcrumbs\`, \`resend-banner\`, and \`bottom-navigation\` template areas are reserved for the
breadcrumb trail, the banner that asks to verify the email address, and the bottom navigation of the
app. Each has to be part of the grid every breakpoint renders and has to be defined by every sub
page of a page or by none of them. \`breadcrumbs\` requires \`layout.breadcrumbs\`. Without a reserved
area the element keeps its default position: the trail below the title bar, the banner above the
page, and the bottom navigation fixed to the bottom of the viewport. \`resend-banner\` and
\`bottom-navigation\` render nothing when the app shows no banner or no bottom navigation.
`,
});
