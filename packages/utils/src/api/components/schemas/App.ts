import { OpenAPIV3 } from 'openapi-types';

import { normalized } from '../../../constants';

export const App: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'An app definition defines what an app will look like.',
  properties: {
    id: {
      type: 'number',
      minimum: 0,
      readOnly: true,
      description: `The unique identifier for the app.

This value will be generated automatically by the API.
`,
    },
    OrganizationId: {
      $ref: '#/components/schemas/Organization/properties/id',
    },
    path: {
      type: 'string',
      minLength: 1,
      maxLength: 30,
      pattern: normalized.source,
      description: `The URL path segment on which this app is reachable.

This may only contain lower case characters, numbers, and hyphens. By default this is a
normalized version of the app name.
`,
    },
    domain: {
      type: 'string',
      oneOf: [
        { type: 'string', maxLength: 0 },
        { type: 'string', format: 'hostname' },
      ],
      description: `The domain name on which this app should be served.

If this is unspecified, the app will be served from the path on the domain of the server
\`HOSTNAME\` variable.
`,
    },
    private: {
      type: 'boolean',
      description: 'Determines whether this app should be included when fetching all apps.',
    },
    locked: {
      type: 'boolean',
      description: `Determines whether this app should be locked from being updated.

This must be set to \`false\` before any other changes can be made to an app.
`,
    },
    template: {
      type: 'boolean',
      description: 'Determines whether this app should be included when fetching for templates.',
    },
    longDescription: {
      type: 'string',
      description: `
A long description for the app.

The long desciption will be rendered on the app details page. Markdown content is supported.
`,
    },
    definition: { $ref: '#/components/schemas/AppDefinition' },
    screenshotUrls: {
      type: 'array',
      description: 'A list of URLs referencing app screenshots',
      items: { type: 'string' },
    },
  },
};
