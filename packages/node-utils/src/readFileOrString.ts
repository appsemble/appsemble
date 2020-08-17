import { promises as fs } from 'fs';

/**
 * If the string represents an existing path, read the file. Otherwise, return the string itself.
 *
 * @param string - The string to handle.
 * @returns The handled string.
 */
export async function readFileOrString(string: string | Buffer): Promise<string | Buffer> {
  try {
    return await fs.readFile(string);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return string;
    }
    throw err;
  }
}
