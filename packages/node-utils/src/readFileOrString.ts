import * as fs from 'fs';

/**
 * If the string represents an existing path, read the file. Otherwise, return the string itself.
 *
 * @param string The string to handle.
 * @returns The handled string.
 */
export default async function readFileOrString(string: string | Buffer): Promise<string | Buffer> {
  const stats = await fs.promises.stat(string);
  return stats.isFile() ? fs.promises.readFile(string) : string;
}
