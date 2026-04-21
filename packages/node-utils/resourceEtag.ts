import { createHash } from 'node:crypto';

import { type Context } from 'koa';
import sortKeys from 'sort-keys';

import { AppsembleError } from './AppsembleError.js';
import { throwKoaError } from './koa.js';

const ignoredEtagFields = new Set(['$author', '$clonable', '$editor', '$etag', '$group', '$seed']);

function normalizeEtagValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toJSON();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeEtagValue);
  }

  if (value && typeof value === 'object') {
    return sortKeys(
      Object.fromEntries(
        Object.entries(value)
          .filter(([key]) => !ignoredEtagFields.has(key))
          .map(([key, entry]) => [key, normalizeEtagValue(entry)]),
      ),
      { deep: true },
    );
  }

  return value;
}

export function createResourceEtag(resource: Record<string, unknown>): string {
  const canonicalResource = JSON.stringify(normalizeEtagValue(resource));
  const hash = createHash('sha256').update(canonicalResource, 'utf8').digest('base64url');

  return `"${hash}"`;
}

export function addResourceEtag<T extends Record<string, unknown>>(
  resource: T,
): T & { $etag: string } {
  return {
    ...resource,
    $etag: createResourceEtag(resource),
  };
}

function parseIfMatchValue(ifMatch: string): string[] {
  return ifMatch
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function matchesResourceIfMatch(
  ifMatch: string | string[] | undefined,
  currentEtag: string,
): boolean {
  if (!ifMatch) {
    return true;
  }

  const values = new Set((Array.isArray(ifMatch) ? ifMatch : [ifMatch]).flatMap(parseIfMatchValue));

  return values.has('*') || values.has(currentEtag);
}

export function setResourceEtagHeader(
  ctx: Context,
  resource: Record<string, unknown> | null | undefined,
): void {
  if (resource) {
    ctx.set('ETag', '$etag' in resource ? String(resource.$etag) : createResourceEtag(resource));
  }
}

export class ResourcePreconditionFailedError extends AppsembleError {
  readonly data: {
    code: 'RESOURCE_PRECONDITION_FAILED';
    resourceId: number | string;
    resourceType: string;
  };

  readonly error = 'Precondition Failed';

  readonly statusCode = 412;

  constructor(resourceType: string, resourceId: number | string) {
    super('This resource has changed since it was loaded. Fetch the latest version and try again.');
    this.name = 'ResourcePreconditionFailedError';
    this.data = {
      code: 'RESOURCE_PRECONDITION_FAILED',
      resourceId,
      resourceType,
    };
  }
}

export function createResourcePreconditionFailedError(
  resourceType: string,
  resourceId: number | string,
): ResourcePreconditionFailedError {
  return new ResourcePreconditionFailedError(resourceType, resourceId);
}

export function throwResourcePreconditionFailedKoaError(
  ctx: Context,
  resourceType: string,
  resourceId: number | string,
): never {
  const error = createResourcePreconditionFailedError(resourceType, resourceId);

  throwKoaError(ctx, error.statusCode, error.message, error.data);
}
