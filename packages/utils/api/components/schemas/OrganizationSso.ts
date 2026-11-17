import { organizationLoginMethods, predefinedOrganizationRoles } from '@appsemble/types';
import { type OpenAPIV3 } from 'openapi-types';

export const OrganizationSsoConfiguration: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'The identity provider and access policy for an organization.',
  additionalProperties: false,
  required: ['issuer', 'clientId', 'name', 'policy'],
  properties: {
    issuer: { type: 'string', format: 'uri', minLength: 1 },
    clientId: { type: 'string', minLength: 1 },
    clientSecret: { type: 'string', minLength: 1, writeOnly: true },
    name: { type: 'string', minLength: 1 },
    scope: { type: 'string', minLength: 1, default: 'openid email profile' },
    groupClaim: { type: 'string', minLength: 1, default: 'groups' },
    roleMappings: {
      type: 'array',
      default: [],
      items: {
        type: 'object',
        description: 'An external group grant for an organization role.',
        additionalProperties: false,
        required: ['group', 'role'],
        properties: {
          group: { type: 'string', minLength: 1 },
          role: { enum: predefinedOrganizationRoles },
        },
      },
    },
    policy: { enum: ['optional', 'required', 'required-with-guests'] },
    allowedLoginMethods: {
      type: 'array',
      uniqueItems: true,
      default: [...organizationLoginMethods],
      items: { enum: [...organizationLoginMethods] },
    },
  },
};

export const OrganizationSsoSettings: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'Organization single sign-on settings with redacted client credentials.',
  additionalProperties: false,
  properties: {
    ...Object.fromEntries(
      Object.entries(OrganizationSsoConfiguration.properties!).filter(
        ([key]) => key !== 'clientSecret',
      ),
    ),
    managedBy: { enum: ['studio', 'deployment'] },
    hasClientSecret: { type: 'boolean' },
  },
};

export const OrganizationSsoDomain: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'An email domain used to discover an organization single sign-on provider.',
  additionalProperties: false,
  required: ['domain', 'verified', 'managedBy', 'recordName', 'recordValue'],
  properties: {
    domain: { type: 'string' },
    verified: { type: 'boolean' },
    managedBy: { enum: ['studio', 'deployment'] },
    recordName: { type: 'string' },
    recordValue: { type: 'string' },
  },
};
