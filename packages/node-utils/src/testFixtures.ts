import { createReadStream, promises as fs, ReadStream } from 'fs';
import { join } from 'path';

import normalizePath from 'normalize-path';

let baseDir: string;

/**
 * Set the test fixture base path. This folder should contain a folder named `__fixtures__`.
 *
 * This is typically called in `jest.setup.ts`.
 *
 * @param dir - The base directory
 * @example
 * ```ts
 * setFixtureBase(__dirname);
 * ```
 */
export function setFixtureBase(dir: string): void {
  baseDir = join(dir, '__fixtures__');
}

/**
 * Resolve the path to a test fixture.
 *
 * @param path - The path to resolve relative to the fixture base. It will be normalized for the
 * operating system.
 * @returns The full path to the fixture path.
 */
export function resolveFixture(path: string): string {
  return join(baseDir, normalizePath(path));
}

/**
 * Read a test fixture.
 *
 * @param path - The path to resolve relative to the fixture base. It will be normalized for the
 * operating system.
 * @param encoding - The text encoding of the file.
 * @returns The file contents as a string or buffer.
 */
export function readFixture(path: string): Promise<Buffer>;
export function readFixture(path: string, encoding: BufferEncoding): Promise<string>;
export function readFixture(path: string, encoding?: BufferEncoding): Promise<Buffer | string> {
  return fs.readFile(resolveFixture(path), encoding);
}

/**
 * Create a read stream for a fixture.
 *
 * @param path - The path to resolve relative to the fixture base. It will be normalized for the
 * operating system.
 * @returns A filesystem read stream for the fixture.
 */
export function createFixtureStream(path: string): ReadStream {
  return createReadStream(resolveFixture(path));
}
