import { createHash } from 'crypto';

export function getGravatarUrl(email: string): string {
  if (!email) {
    return;
  }

  return `https://www.gravatar.com/avatar/${createHash('md5')
    .update(email)
    .digest('hex')}?s=128&d=mp`;
}
