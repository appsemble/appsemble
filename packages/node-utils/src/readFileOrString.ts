import { promises as fs } from 'fs';

/**
 * If the string represents an existing path, read the file. Otherwise, return the string itself.
 *
 * @param string - The string to handle.
 * @returns The handled string.
 */
export async function readFileOrString(string: Buffer | string): Promise<Buffer | string> {
  try {
    return await fs.readFile(string);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return string;
    }
    throw err;
  }
}
