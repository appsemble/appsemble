import { createReadStream, ReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

let baseDir: string;

/**
 * Set the test fixture base path. This folder should contain a folder named `__fixtures__`.
 *
 * This is typically called in `jest.setup.ts`.
 *
 * @param meta The module meta object
 * @example
 * ```ts
 * setFixtureBase(import.meta);
 * ```
 */
export function setFixtureBase(meta: ImportMeta): void {
  baseDir = meta.url;
}

/**
 * Resolve the path to a test fixture.
 *
 * @param path The path to resolve relative to the fixture base. It will be normalized for the
 * operating system.
 * @returns The full path to the fixture path.
 */
export function resolveFixture(path: string): string {
  return fileURLToPath(new URL(`__fixtures__/${path}`, baseDir));
}

/**
 * Read a test fixture.
 *
 * @param path The path to resolve relative to the fixture base. It will be normalized for the
 * operating system.
 *
 * param encoding The text encoding of the file.
 * @returns The file contents as a string or buffer.
 */
export function readFixture(path: string): Promise<Buffer>;
export function readFixture(path: string, encoding: BufferEncoding): Promise<string>;
export function readFixture(path: string, encoding?: BufferEncoding): Promise<Buffer | string> {
  return readFile(resolveFixture(path), encoding);
}

/**
 * Create a read stream for a fixture.
 *
 * @param path The path to resolve relative to the fixture base. It will be normalized for the
 * operating system.
 * @returns A filesystem read stream for the fixture.
 */
export function createFixtureStream(path: string): ReadStream {
  return createReadStream(resolveFixture(path));
}
