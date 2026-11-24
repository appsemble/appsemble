import { PredefinedOrganizationRole, predefinedOrganizationRoles } from '@appsemble/types';
import { type OpenAPIV3 } from 'openapi-types';

import { OAuth2ClientCredentials } from './OAuth2ClientCredentials.js';

export const OrganizationServiceAccount: OpenAPIV3.NonArraySchemaObject = {
  ...OAuth2ClientCredentials,
  description:
    'An organization account for non-interactive clients that authenticates with OAuth2 client credentials.',
  required: ['description', 'role', 'scopes'],
  properties: {
    ...OAuth2ClientCredentials.properties,
    scopes: { ...OAuth2ClientCredentials.properties!.scopes, minItems: 1 },
    role: {
      description: 'The organization role of the service account.',
      enum: predefinedOrganizationRoles.filter((role) => role !== PredefinedOrganizationRole.Owner),
    },
    created: {
      type: 'string',
      description: 'When the service account was created.',
      format: 'date-time',
      readOnly: true,
    },
  },
};
