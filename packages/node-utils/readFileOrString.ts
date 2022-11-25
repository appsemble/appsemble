import { readFile } from 'node:fs/promises';

import { isErrno } from './index.js';

/**
 * If the string represents an existing path, read the file. Otherwise, return the string itself.
 *
 * @param string The string to handle.
 * @returns The handled string.
 */
export async function readFileOrString(string: Buffer | string): Promise<Buffer | string> {
  try {
    return await readFile(string);
  } catch (error: unknown) {
    if (isErrno(error, 'ENOENT')) {
      return string;
    }
    throw error;
  }
}
