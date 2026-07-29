import { createHash } from 'node:crypto';

const PREFIX = 'resource_';
const HASH_LEN = 12;
// Postgres identifiers are capped at 63 bytes: prefix + slug + '_' + hash must fit.
const SLUG_MAX = 63 - PREFIX.length - 1 - HASH_LEN;

/**
 * Derive the physical partition table name for a resource type.
 *
 * The name is a valid unquoted lowercase Postgres identifier within the 63-byte limit. A hash of the
 * original type is always appended so distinct types never collide — even when their sanitized slugs
 * are equal (e.g. `my-type` and `my_type`) or empty (non-ASCII types) — and so a generated partition
 * never shadows a fixed table such as `Resource` or `ResourceTable`.
 */
export function resourcePartitionName(type: string): string {
  const slug = type
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, SLUG_MAX);
  const hash = createHash('sha1').update(type, 'utf8').digest('hex').slice(0, HASH_LEN);
  return `${PREFIX}${slug}_${hash}`;
}
