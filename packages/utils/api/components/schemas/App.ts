import { OpenAPIV3 } from 'openapi-types';

import { googleAnalyticsIDPattern, normalized } from '../../../constants';

export const App: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'An app definition defines what an app will look like.',
  additionalProperties: false,
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
      anyOf: [
        { type: 'string', maxLength: 0 },
        { type: 'string', format: 'hostname' },
      ],
      description: `The domain name on which this app should be served.

If this is unspecified, the app will be served from the path on the domain of the server
\`HOSTNAME\` variable.
`,
    },
    visibility: {
      description: `Determine the app visibility of the app in the Appsemble app store.

This doesn’t affect whether or not the app can be accessed on its own domain.

- **public**: The app is publicly listed in the Appsemble app store.
- **unlisted**: The app store page can be accessed, but the app isn’t listed publicly in the
  Appsemble app store.
- **private**: The app is only visible to people who are part of the organization.
`,
      default: 'unlisted',
      enum: ['public', 'unlisted', 'private'],
    },
    showAppDefinition: {
      type: 'boolean',
      description: 'Whether or not people who have access to the app may see the app definition.',
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
    googleAnalyticsID: {
      type: 'string',
      description: 'If this is specified, Google analytics will be applied to the app',
      pattern: googleAnalyticsIDPattern.source,
    },
    sentryDsn: {
      type: 'string',
      description: `The Sentry DSN to use for this app.

If this is specified, the given Sentry DSN will be used for error tracking. Apps without a custom
domain fall back to use the Appsemble server Sentry DSN.
`,
      format: 'url',
    },
    sentryEnvironment: {
      type: 'string',
      description: `The name that should be used as the sentry environment.

  This is only applied when \`sentryDsn\` is specified.`,
    },
  },
};
