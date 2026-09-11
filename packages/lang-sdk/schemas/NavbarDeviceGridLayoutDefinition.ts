import { DeviceGridLayoutDefinition } from './DeviceGridLayoutDefinition.js';
import { extendJSONSchema } from './utils/extendJSONSchema.js';

export const NavbarDeviceGridLayoutDefinition = extendJSONSchema(DeviceGridLayoutDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['layout'],
  description: 'Grid layout definition for a navbar breakpoint',
});
