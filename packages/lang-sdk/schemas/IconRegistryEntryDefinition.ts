import { type OpenAPIV3 } from 'openapi-types';

import { normalized } from '../constants/index.js';

export const IconRegistryEntryDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'A custom icon in the app’s `icons` registry.',
  required: ['asset'],
  additionalProperties: false,
  properties: {
    asset: {
      type: 'string',
      pattern: normalized.source,
      description: `The name of the app-level asset holding the icon’s SVG artwork.

This is an asset name, not a URL or asset ID. The asset doesn’t need to exist when the app is
published, but the icon only renders once an SVG asset with this name has been uploaded.
`,
    },
    overrides: {
      type: 'array',
      items: { type: 'string' },
      description: `Font Awesome icons this entry replaces throughout the app.

Wherever the app renders one of these icons by its bare name, it renders this entry’s asset
instead, the same way \`icon:<key>\` does. Use the Font Awesome 6 free icon name, as shown in the
\`fa-<name>\` class of the rendered icon. Each icon can be listed under one entry only.
`,
    },
  },
};
