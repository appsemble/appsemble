import { scimAssert } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { type ScimListResponse, type ScimSchema } from '../types/scim.js';
import { getScimLocation } from '../utils/scim.js';

const schemas: Omit<ScimSchema, 'meta'>[] = [
  {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:Schema'],
    id: 'urn:ietf:params:scim:schemas:core:2.0:User',
    name: 'User',
    description: 'User Account',
    attributes: [
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

export function getSCIMSchemas(ctx: Context): void {
  const {
    pathParams: { appId },
  } = ctx;

  const list: ScimListResponse<ScimSchema> = {
    schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
    totalResults: schemas.length,
    Resources: schemas.map((schema) => ({
      ...schema,
      meta: {
        resourceType: 'Schema',
        location: getScimLocation(appId, `schemas/${schema.id}`),
      },
    })),
  };

  ctx.body = list;
}

export function getSCIMSchema(ctx: Context): void {
  const {
    pathParams: { appId, schemaId },
  } = ctx;

  const schema = schemas.find((s) => s.id === schemaId);
  scimAssert(schema, 404, 'Schema not found');

  ctx.body = {
    ...schema,
    meta: {
      resourceType: 'Schema',
      location: getScimLocation(appId, `schemas/${schema.id}`),
    },
  };
}
