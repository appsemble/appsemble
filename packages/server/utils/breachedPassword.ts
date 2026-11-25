import { createHash } from 'node:crypto';

import { assertKoaCondition, logger } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { argv } from './argv.js';

export const pwnedPasswordsApiUrl = 'https://api.pwnedpasswords.com/';

/**
 * Reject a new password if it appears in the Have I Been Pwned Pwned Passwords data set.
 *
 * Only the first 5 characters of the password’s SHA-1 hash are sent to the API, and the response
 * is padded so its size doesn’t reveal them. If the API can’t be reached, the password is accepted
 * and a warning is logged, so an outage of the API doesn’t block registrations and password resets.
 * The check only runs if `rejectBreachedPasswords` is set.
 *
 * @param ctx The Koa context used to throw the error response.
 * @param password The new password in plain text.
 */
export async function assertPasswordNotBreached(ctx: Context, password: string): Promise<void> {
  if (!argv.rejectBreachedPasswords) {
    return;
  }
  const hash = createHash('sha1').update(password).digest('hex').toUpperCase();
  let range: string;
  try {
    const response = await fetch(new URL(`range/${hash.slice(0, 5)}`, pwnedPasswordsApiUrl), {
      headers: { 'Add-Padding': 'true' },
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    range = await response.text();
  } catch (error) {
    logger.warn(`Unable to check the password against Have I Been Pwned: ${error}`);
    return;
  }
  const suffix = hash.slice(5);
  // Padding lines have a count of 0.
  const breached = range.split('\n').some((line) => {
    const [lineSuffix, count] = line.split(':');
    return lineSuffix === suffix && Number(count) > 0;
  });
  assertKoaCondition(
    !breached,
    ctx,
    400,
    'This password has appeared in a known data breach. Choose a different password.',
    { breachedPassword: true },
  );
}
