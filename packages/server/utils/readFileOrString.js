import fs from 'fs-extra';

/**
 * If the string represents an existing path, read the file. Otherwise, return the string itself.
 *
 * @param {string} string The string to handle.
 * @returns {string} The handled string.
 */
export default async function readFileOrString(string) {
  const exists = await fs.pathExists(string);
  return exists ? fs.readFile(string) : string;
}
