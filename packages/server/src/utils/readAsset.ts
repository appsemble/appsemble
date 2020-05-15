import { promises } from 'fs';
import path from 'path';

export const assetDir = path.resolve(__dirname, '../../assets');

/**
 * Read a file from the server assets directory.
 *
 * @param filename The path to the file to read, relative to the assets directory.
 * @param encoding If specified, decode the file using this encoding.
 *
 * @returns The content of the specified file.
 */
export default async function readAsset(
  filename: string,
  encoding?: 'utf-8',
): Promise<string | Buffer> {
  return promises.readFile(path.join(assetDir, filename), encoding);
}
