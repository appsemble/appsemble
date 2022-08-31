import { readFile } from 'fs/promises';

export const assetDir = new URL('../assets/', import.meta.url);

/**
 * Read a file from the server assets directory.
 *
 * @param filename The path to the file to read, relative to the assets directory.
 * @param encoding If specified, decode the file using this encoding.
 * @returns The content of the specified file.
 */
export function readAsset(filename: string): Promise<Buffer>;
export function readAsset(filename: string, encoding: BufferEncoding): Promise<string>;
export function readAsset(filename: string, encoding?: BufferEncoding): Promise<Buffer | string> {
  return readFile(new URL(filename, assetDir), encoding);
}
