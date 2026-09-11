import { describe, expect, it } from 'vitest';

import {
  addResourceEtag,
  createResourceEtag,
  matchesResourceIfMatch,
  setResourceEtagHeader,
} from './resourceEtag.js';

describe('createResourceEtag', () => {
  it('produces a quoted base64url string', () => {
    const etag = createResourceEtag({ id: 1, foo: 'bar' });
    expect(etag).toMatch(/^"[\w-]+"$/);
  });

  it('ignores server-managed metadata at the top level only', () => {
    const a = createResourceEtag({
      id: 1,
      $author: { id: 'a' },
      $editor: { id: 'b' },
      $group: { id: 'g' },
      $seed: false,
      $ephemeral: false,
      foo: 'x',
    });
    const b = createResourceEtag({
      id: 1,
      $author: { id: 'z' },
      $editor: { id: 'q' },
      $group: { id: 'h' },
      $seed: true,
      $ephemeral: true,
      foo: 'x',
    });
    expect(a).toBe(b);
  });

  it('does not strip $-prefixed keys nested in user data, to avoid collisions', () => {
    const a = createResourceEtag({ id: 1, payload: { $author: 'foo', name: 'rex' } });
    const b = createResourceEtag({ id: 1, payload: { $author: 'bar', name: 'rex' } });
    expect(a).not.toBe(b);
  });

  it('includes $clonable in the hash because clients can write it', () => {
    const a = createResourceEtag({ id: 1, $clonable: false });
    const b = createResourceEtag({ id: 1, $clonable: true });
    expect(a).not.toBe(b);
  });

  it('is stable across key ordering', () => {
    const a = createResourceEtag({ id: 1, foo: 'x', bar: 'y' });
    const b = createResourceEtag({ bar: 'y', foo: 'x', id: 1 });
    expect(a).toBe(b);
  });
});

describe('addResourceEtag', () => {
  it('attaches $etag and is idempotent', () => {
    const first = addResourceEtag({ id: 1, foo: 'x' });
    expect(first.$etag).toMatch(/^"[\w-]+"$/);
    const second = addResourceEtag(first);
    expect(second.$etag).toBe(first.$etag);
  });
});

describe('matchesResourceIfMatch', () => {
  const current = createResourceEtag({ id: 1, foo: 'x' });

  it('returns true when no header is sent', () => {
    expect(matchesResourceIfMatch(undefined, current)).toBe(true);
    expect(matchesResourceIfMatch('', current)).toBe(true);
  });

  it('matches the current etag', () => {
    expect(matchesResourceIfMatch(current, current)).toBe(true);
  });

  it('matches the wildcard', () => {
    expect(matchesResourceIfMatch('*', current)).toBe(true);
  });

  it('matches an etag in a comma-separated list', () => {
    expect(matchesResourceIfMatch(`"other", ${current}`, current)).toBe(true);
  });

  it('rejects a weak validator under strong comparison', () => {
    const weak = `W/${current}`;
    expect(matchesResourceIfMatch(weak, current)).toBe(false);
  });

  it('rejects a stale etag', () => {
    expect(matchesResourceIfMatch('"stale"', current)).toBe(false);
  });

  it('tolerates etag values containing literal commas inside the quoted body', () => {
    // The current implementation parses quoted-strings, so commas inside the
    // body do not split a single token. We round-trip a synthetic etag that
    // contains a comma to assert the parser keeps it whole.
    const synthetic = '"abc,def"';
    expect(matchesResourceIfMatch(synthetic, synthetic)).toBe(true);
  });
});

describe('setResourceEtagHeader', () => {
  function makeCtx(): {
    headers: Record<string, string>;
    set: (name: string, value: string) => void;
  } {
    const headers: Record<string, string> = {};
    return {
      headers,
      set(name, value) {
        headers[name] = value;
      },
    };
  }

  it('reuses an existing string $etag', () => {
    const ctx = makeCtx();
    setResourceEtagHeader(ctx as any, { id: 1, $etag: '"abc"' } as any);
    expect(ctx.headers.ETag).toBe('"abc"');
  });

  it('computes a fresh etag when $etag is missing or not a string', () => {
    const ctx = makeCtx();
    setResourceEtagHeader(ctx as any, { id: 1, foo: 'x' });
    expect(ctx.headers.ETag).toMatch(/^"[\w-]+"$/);

    const ctx2 = makeCtx();
    setResourceEtagHeader(ctx2 as any, { id: 1, foo: 'x', $etag: undefined } as any);
    expect(ctx2.headers.ETag).toMatch(/^"[\w-]+"$/);
    expect(ctx2.headers.ETag).not.toBe('undefined');
  });

  it('does nothing when given null or undefined', () => {
    const ctx = makeCtx();
    setResourceEtagHeader(ctx as any, null);
    expect(ctx.headers.ETag).toBeUndefined();
    setResourceEtagHeader(ctx as any, undefined);
    expect(ctx.headers.ETag).toBeUndefined();
  });
});
