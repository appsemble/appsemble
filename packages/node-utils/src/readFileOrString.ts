import fs from 'fs';

/**
 * If the string represents an existing path, read the file. Otherwise, return the string itself.
 *
 * @param string The string to handle.
 * @returns The handled string.
 */
export default async function readFileOrString(string: string | Buffer): Promise<string | Buffer> {
  try {
    return await fs.promises.readFile(string);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return string;
    }
    throw err;
  }
}
