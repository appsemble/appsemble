import { scimAssert } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { type ScimListResponse } from '../types/scim.js';
import { getScimLocation } from '../utils/scim.js';

function getResourceType(appId: number): unknown {
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

export function getSCIMResourceType(ctx: Context): void {
  const {
    pathParams: { appId, resourceTypeId },
  } = ctx;

  scimAssert(resourceTypeId === 'User', 404, 'ResourceType not found');

  ctx.body = getResourceType(appId);
}

export function getSCIMResourceTypes(ctx: Context): void {
  const {
    pathParams: { appId },
  } = ctx;

  const resources: unknown[] = [getResourceType(appId)];

  const list: ScimListResponse<unknown> = {
    schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
    totalResults: resources.length,
    Resources: resources,
  };

  ctx.body = list;
}
