import { type OpenAPIV3 } from 'openapi-types';

import { OrganizationSsoSettings } from '../../../components/schemas/OrganizationSso.js';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/organizationId' }],
  get: {
    tags: ['main', 'organization'],
    operationId: 'getOrganizationSso',
    description: 'Get the organization single sign-on settings.',
    security: [{ studio: [] }],
    responses: {
      200: {
        description: 'The single sign-on settings, or null when unconfigured.',
        content: {
          'application/json': {
            schema: { ...OrganizationSsoSettings, nullable: true },
          },
        },
      },
    },
  },
  put: {
    tags: ['main', 'organization'],
    operationId: 'putOrganizationSso',
    description: 'Set the organization single sign-on settings.',
    security: [{ studio: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/OrganizationSsoConfiguration' },
        },
      },
    },
    responses: {
      200: {
        description: 'The saved settings.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/OrganizationSsoSettings' },
          },
        },
      },
    },
  },
  delete: {
    tags: ['main', 'organization'],
    operationId: 'deleteOrganizationSso',
    description: 'Remove the organization single sign-on settings.',
    security: [{ studio: [] }],
    responses: { 204: { description: 'The single sign-on settings have been removed.' } },
  },
};
