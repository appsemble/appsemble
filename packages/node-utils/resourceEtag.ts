import { createHash } from 'node:crypto';

import { type Context } from 'koa';
import sortKeys from 'sort-keys';

import { AppsembleError } from './AppsembleError.js';
import { throwKoaError } from './koa.js';

// Server-managed metadata keys that are echoed in resource responses but are not
// part of the resource's identity for ETag purposes. Stripped only at the top
// level; nested user data may legitimately contain keys with the same names.
const ignoredEtagFields = new Set(['$author', '$editor', '$etag', '$group', '$seed', '$ephemeral']);

function canonicalize(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toJSON();
  }

  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value && typeof value === 'object') {
    return sortKeys(
      Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
          key,
          canonicalize(entry),
        ]),
      ),
      { deep: true },
    );
  }

  return value;
}

export function createResourceEtag(resource: Record<string, unknown>): string {
  const stripped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(resource)) {
    if (!ignoredEtagFields.has(key)) {
      stripped[key] = value;
    }
  }
  const canonicalResource = JSON.stringify(canonicalize(stripped));
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

// RFC 7232 §3.1: If-Match uses the strong-comparison function, so weak
// validators (prefixed with `W/`) must not match. Tokens are split with a
// quoted-string-aware parser instead of a naive `,` split.
function parseIfMatchValue(ifMatch: string): string[] {
  if (ifMatch === '*') {
    return ['*'];
  }
  const tokens: string[] = [];
  let i = 0;
  while (i < ifMatch.length) {
    while (
      i < ifMatch.length &&
      (ifMatch[i] === ' ' || ifMatch[i] === ',' || ifMatch[i] === '\t')
    ) {
      i += 1;
    }
    if (i >= ifMatch.length) {
      break;
    }
    // Skip any leading weak prefix; strong comparison rejects it.
    let weak = false;
    if (ifMatch[i] === 'W' && ifMatch[i + 1] === '/') {
      weak = true;
      i += 2;
    }
    if (ifMatch[i] !== '"') {
      // Malformed token; skip until next comma.
      while (i < ifMatch.length && ifMatch[i] !== ',') {
        i += 1;
      }
      continue;
    }
    const start = i;
    i += 1;
    while (i < ifMatch.length && ifMatch[i] !== '"') {
      i += 1;
    }
    if (i >= ifMatch.length) {
      break;
    }
    i += 1;
    if (!weak) {
      tokens.push(ifMatch.slice(start, i));
    }
  }
  return tokens;
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
  if (!resource) {
    return;
  }
  const etag = typeof resource.$etag === 'string' ? resource.$etag : createResourceEtag(resource);
  ctx.set('ETag', etag);
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

export function throwResourcePreconditionFailedKoaError(
  ctx: Context,
  resourceType: string,
  resourceId: number | string,
): never {
  const error = new ResourcePreconditionFailedError(resourceType, resourceId);
  throwKoaError(ctx, error.statusCode, error.message, error.data);
}
