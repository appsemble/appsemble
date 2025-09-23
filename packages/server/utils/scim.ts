import { argv } from './argv.js';
import { type AppMember } from '../models/index.js';
import { type ScimSchema, type ScimUser } from '../types/index.js';

export const SCIM_LIST_RESPONSE = 'urn:ietf:params:scim:api:messages:2.0:ListResponse';

export const schemas: Omit<ScimSchema, 'meta'>[] = [
  {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:Schema'],
    id: 'urn:ietf:params:scim:schemas:core:2.0:User',
    name: 'User',
    description: 'User Account',
    attributes: [
      {
        name: 'active',
        type: 'boolean',
        multiValued: false,
        description: 'A boolean indicating whether or not the user is active',
        required: true,
        mutability: 'readWrite',
        returned: 'always',
        uniqueness: 'none',
      },
      {
        name: 'externalId',
        type: 'string',
        multiValued: false,
        description: 'The ID of the user on the SCIM client',
        required: true,
        caseExact: true,
        mutability: 'readWrite',
        returned: 'always',
        uniqueness: 'global',
      },
      {
        name: 'id',
        type: 'string',
        multiValued: false,
        description: 'The app member ID in Appsemble',
        required: true,
        caseExact: true,
        mutability: 'immutable',
        returned: 'always',
        uniqueness: 'global',
      },
      {
        name: 'locale',
        type: 'string',
        multiValued: false,
        description: 'The preferred locale of the user',
        required: false,
        caseExact: true,
        mutability: 'readWrite',
        returned: 'always',
        uniqueness: 'none',
      },
      {
        name: 'name',
        type: 'complex',
        multiValued: false,
        description: 'The user’s name',
        required: false,
        caseExact: true,
        mutability: 'readWrite',
        returned: 'always',
        uniqueness: 'none',
        subAttributes: [
          {
            name: 'formatted',
            type: 'string',
            multiValued: false,
            description: 'The user’s display name',
            required: false,
            caseExact: true,
            mutability: 'readWrite',
            returned: 'always',
            uniqueness: 'none',
          },
        ],
      },
      {
        name: 'timezone',
        type: 'string',
        multiValued: false,
        description: 'The preferred time zone of the user',
        required: false,
        caseExact: false,
        mutability: 'readWrite',
        returned: 'always',
        uniqueness: 'none',
      },
      {
        name: 'userName',
        type: 'string',
        multiValued: false,
        description: 'The user’s display name',
        required: true,
        caseExact: false,
        mutability: 'readWrite',
        returned: 'always',
        uniqueness: 'none',
      },
    ],
  },
  {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:Schema'],
    id: 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
    name: 'User',
    description: 'Enterprise user account',
    attributes: [
      {
        name: 'manager',
        type: 'string',
        multiValued: false,
        description: 'The ID of the user on the SCIM client',
        required: true,
        caseExact: true,
        mutability: 'readWrite',
        returned: 'always',
        uniqueness: 'none',
      },
    ],
  },
];

/**
 * Get the SCIM location given an app ID and a path segment
 *
 * @param appId The app ID.
 * @param pathSegment The path segment to append.
 * @returns The prefix for SCIM endpoints.
 */
export function getScimLocation(appId: number, pathSegment: string): string {
  return String(new URL(`/api/apps/${appId}/scim/${pathSegment}`, argv.host));
}

export function getScimResourceType(appId: number): unknown {
  return {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:ResourceType'],
    id: 'User',
    name: 'User',
    endpoint: getScimLocation(appId, 'Users'),
    description: 'https://tools.ietf.org/html/rfc7643#section-8.7.1',
    schema: 'urn:ietf:params:scim:schemas:core:2.0:User',
    schemaExtensions: [
      {
        schema: 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
        required: false,
      },
    ],
    meta: {
      location: getScimLocation(appId, 'ResourceTypes/User'),
      resourceType: 'ResourceType',
    },
  };
}

export function convertAppMemberToScimUser(appId: number, member: AppMember): ScimUser {
  return {
    schemas: [
      'urn:ietf:params:scim:schemas:core:2.0:User',
      'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
    ],
    userName: member.email ?? undefined,
    active: member.scimActive,
    id: member.id,
    externalId: member.scimExternalId,
    name: member.name
      ? {
          formatted: member.name,
        }
      : undefined,
    timezone: member.timezone,
    locale: member.locale,
    // @ts-expect-error 2322 undefined is not assignable to type (strictNullChecks)
    'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User': member.GroupMembers?.length
      ? {
          // @ts-expect-error 2532 object is possibly undefined (strictNullChecks)
          manager: { value: member.GroupMembers.at(-1).Group.name },
        }
      : undefined,
    meta: {
      created: member.created.toISOString(),
      lastModified: member.updated.toISOString(),
      location: getScimLocation(appId, `Users/${member.id}`),
      resourceType: 'User',
    },
  };
}
