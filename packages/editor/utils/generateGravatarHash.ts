import md5 from 'md5';

/**
 * Generates a gravatar URL based on given email.
 *
 * @param email Email to get gravatar of.
 * @param size Size of the image in pixels.
 */
export default function generateGravatarHash(email: string, size = 64): string {
  return `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?s=${size}&d=mp`;
}
