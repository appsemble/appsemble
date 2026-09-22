import { ResponsiveGridLayoutDefinition } from './ResponsiveGridLayoutDefinition.js';
import { extendJSONSchema } from './utils/extendJSONSchema.js';

export const NavbarLayoutDefinition = extendJSONSchema(ResponsiveGridLayoutDefinition, {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  description: `Responsive grid layout for the top navigation header.

The available template areas are logo, name, navigation, and controls.
Each rendered area must be included and their first visual occurrence must follow that order.
`,
  properties: {
    desktop: {
      $ref: '#/components/schemas/NavbarDeviceGridLayoutDefinition',
    },
    mobile: {
      $ref: '#/components/schemas/NavbarDeviceGridLayoutDefinition',
    },
    tablet: {
      $ref: '#/components/schemas/NavbarDeviceGridLayoutDefinition',
    },
  },
});
