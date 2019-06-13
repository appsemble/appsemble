import md5 from 'md5';

/**
 * Generates a gravatar URL based on given email.
 *
 * @param {string} email Email to get gravatar of.
 * @param {number} size Size of the image in pixels.
 */
export default function generateGravatarHash(email, size = 64) {
  return `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?s=${size}&d=mp`;
}
