import { describe, expect, it } from 'vitest';

import { resourcePartitionName } from './resourcePartition.js';

describe('resourcePartitionName', () => {
  it('produces a valid, lowercase, unquoted identifier within Postgres 63-byte limit', () => {
    const name = resourcePartitionName('training');
    expect(name).toMatch(/^[a-z0-9_]+$/);
    expect(name.startsWith('resource_')).toBe(true);
    expect(name).toContain('training');
    expect(Buffer.byteLength(name, 'utf8')).toBeLessThanOrEqual(63);
  });

  it('is deterministic for the same type', () => {
    expect(resourcePartitionName('training')).toBe(resourcePartitionName('training'));
  });

  it('gives distinct names to types that sanitize to the same slug', () => {
    // both slug to "my_type"; a hash suffix must keep them apart
    const a = resourcePartitionName('my-type');
    const b = resourcePartitionName('my_type');
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[a-z0-9_]+$/);
    expect(b).toMatch(/^[a-z0-9_]+$/);
  });

  it('stays within 63 bytes and unique for long, non-ASCII type names', () => {
    const a = resourcePartitionName('ä'.repeat(100));
    const b = resourcePartitionName('ä'.repeat(101));
    expect(Buffer.byteLength(a, 'utf8')).toBeLessThanOrEqual(63);
    expect(Buffer.byteLength(b, 'utf8')).toBeLessThanOrEqual(63);
    expect(a).toMatch(/^[a-z0-9_]+$/);
    expect(a).not.toBe(b);
  });
});
