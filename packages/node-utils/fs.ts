import { type Dirent, type Stats } from 'node:fs';
import { mkdir, opendir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';

import { compareStrings } from '@appsemble/utils';
import parseJson from 'parse-json';
import sortKeys from 'sort-keys';
import { type Promisable } from 'type-fest';
import { parse, stringify } from 'yaml';

import { AppsembleError } from './index.js';

/**
 * Test if the error is a NodeJS errno exception.
 *
 * @param error The value to check
 * @param code If specified, check if the code matches
 * @returns Whether or not the error is a NodeJS errno exception.
 */
export function isErrno(error: unknown, code?: string): error is NodeJS.ErrnoException {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const err = error as NodeJS.ErrnoException;
  if (code) {
    return err.code === code;
  }
  return typeof err.code === 'string';
}

/**
 * Read the content of a JSON or YAML file.
 *
 * @param path The path to the file to read.
 * @returns A tuple of the parsed content and the content as a string.
 */
export async function readData<R>(path: URL | string): Promise<[R, string]> {
  let content: string;
  const ext = extname(String(path));
  try {
    content = await readFile(path, 'utf8');
  } catch {
    throw new AppsembleError(`Error reading file ${path}`);
  }
  if (ext !== '.yaml' && ext !== '.yml' && ext !== '.json') {
    throw new AppsembleError(`Unknown file extension: ${path}`);
  }
  try {
    return [
      (ext === '.json' ? parseJson(content) : parse(content, { maxAliasCount: 10_000 })) as R,
      content,
    ];
  } catch (error: unknown) {
    throw new AppsembleError(`Error parsing ${path}\n${(error as Error).message}`);
  }
}

interface WriteDataOptions {
  /**
   * If false, don’t sort the object keys.
   */
  readonly sort?: boolean;

  /**
   * A comparison function to use for sorting keys.
   *
   * By default natural sorting will be used.
   */
  readonly compare?: ((a: string, b: string) => number) | null;
}

/**
 * Write data to a file serialized as JSON or YAML.
 *
 * If `prettier` is available, the content is also formatted.
 *
 * @param path The file path to write the data to.
 * @param data The data to write to the file.
 * @param options Additional options for processing the data.
 * @returns The formatted content.
 */
export async function writeData(
  path: string,
  data: unknown,
  { compare = compareStrings, sort = true }: WriteDataOptions = {},
): Promise<string> {
  // @ts-expect-error 2769 No overload matches this call (strictNullChecks)
  const sorted = sort ? sortKeys(data, { deep: true, compare: compare || undefined }) : data;
  let buffer: string;
  try {
    const { default: prettier } = await import('prettier');
    const { inferredParser } = await prettier.getFileInfo(path, { resolveConfig: true });
    const prettierOptions = await prettier.resolveConfig(path, { editorconfig: true });
    // @ts-expect-error 18048 variable is possibly null (strictNullChecks)
    prettierOptions.parser = inferredParser;
    buffer =
      inferredParser === 'yaml' ? stringify(sorted) : `${JSON.stringify(sorted, undefined, 2)}\n`;
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    buffer = await prettier.format(buffer, prettierOptions);
  } catch {
    const ext = extname(path);
    buffer =
      ext === '.yml' || ext === '.yaml'
        ? stringify(sorted)
        : `${JSON.stringify(sorted, undefined, 2)}\n`;
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, buffer);
  return buffer;
}

interface OpenDirSafeOptions {
  allowMissing?: boolean;
  recursive?: boolean;
}

/**
 * Read the contents of a directory.
 *
 * @param directory The path of the directory to open.
 * @param onFile A callback which will get called for every file. This will be called with the full
 *   file path as its first argument and its `Dirent` object as the second argument.
 * @param options Additional options.
 */
export async function opendirSafe(
  directory: string,
  onFile: (fullpath: string, stat: Dirent) => Promisable<void>,
  options: OpenDirSafeOptions = {},
): Promise<void> {
  let stats: Stats;
  try {
    stats = await stat(directory);
  } catch (err: unknown) {
    if (options.allowMissing && isErrno(err, 'ENOENT')) {
      return;
    }
    throw new AppsembleError(`Expected ${directory} to be a directory`);
  }
  if (!stats.isDirectory()) {
    throw new AppsembleError(`Expected ${directory} to be a directory`);
  }
  const dir = await opendir(directory);
  for await (const file of dir) {
    const fullPath = join(directory, file.name);
    await onFile(fullPath, file);
    if (options.recursive && file.isDirectory()) {
      await opendirSafe(fullPath, onFile, options);
    }
  }
}
