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
      items: { type: 'string', format: 'fontawesome' },
      uniqueItems: true,
      description: `Font Awesome icon names to replace with this icon everywhere in the app.

Use the name from the icon’s \`fa-<name>\` class. A name can only be listed once.
`,
    },
  },
};
