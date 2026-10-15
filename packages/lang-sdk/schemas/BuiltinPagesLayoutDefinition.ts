import { ResponsiveGridLayoutDefinition } from './ResponsiveGridLayoutDefinition.js';
import { extendJSONSchema } from './utils/extendJSONSchema.js';

export const BuiltinPagesLayoutDefinition = extendJSONSchema(ResponsiveGridLayoutDefinition, {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  description: `Responsive grid layout for the built-in pages of the app.

The layout applies unchanged to every built-in page and to every state of it. Without it, no
built-in page becomes a grid or gains a heading.

The available template areas are \`resend-banner\`, \`title\`, \`content\`, and \`bottom-navigation\`.
\`content\` holds everything the page renders for its current state and has to be part of the grid
every breakpoint renders. The others are optional and have to be named by the grid of every
breakpoint or of none: \`title\` is a heading that renders the name of the page, \`resend-banner\`
places the banner that asks to verify the email address, and \`bottom-navigation\` places the bottom
navigation. Without their area the banner renders above the page and the bottom navigation is fixed
to the bottom of the viewport; with it, they render nothing when the app shows none. The first
visual occurrence of the areas has to follow that order, so that keyboard, screen reader, and visual
order agree.

Breakpoints before the first one the layout defines render a single column with one row per area,
in that same order.
`,
});
