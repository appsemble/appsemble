import { createHash } from 'node:crypto';

export function getGravatarUrl(email: string): string {
  if (!email) {
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    return;
  }

  return `https://www.gravatar.com/avatar/${createHash('md5')
    .update(email)
    .digest('hex')}?s=128&d=mp`;
}
