import { createHash } from 'node:crypto';

import { vi } from 'vitest';

const realFetch = globalThis.fetch;

/**
 * Answer Pwned Passwords range requests as if exactly the given passwords were breached.
 *
 * Other requests are passed on to the real `fetch`.
 *
 * @param breachedPasswords The passwords the fake API reports as breached.
 */
export function mockPwnedPasswords(breachedPasswords: string[]): void {
  const hashes = breachedPasswords.map((password) =>
    createHash('sha1').update(password).digest('hex').toUpperCase(),
  );
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.origin !== 'https://api.pwnedpasswords.com') {
      return realFetch(input, init);
    }
    const prefix = url.pathname.replace('/range/', '');
    const body = hashes
      .filter((hash) => hash.startsWith(prefix))
      .map((hash) => `${hash.slice(5)}:1`)
      .join('\r\n');
    return Promise.resolve(new Response(body));
  });
}
