import { Dirent, promises as fs, Stats } from 'fs';
import { join } from 'path';

import yaml from 'js-yaml';
import { Promisable } from 'type-fest';

import { AppsembleError } from '.';

/**
 * Test if the error is a NodeJS errno exception.
 *
 * @param error - The value to check
 * @param code - If specified, theck if the code matches
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
 * Read and parse a YAML file.
 *
 * @param path - The path to the file to read.
 * @returns A tuple of the parsed YAML content and the YAML content as a string.
 */
export async function readYaml<R>(path: string): Promise<[R, string]> {
  let content: string;
  try {
    content = await fs.readFile(path, 'utf8');
  } catch {
    throw new AppsembleError(`Error reading file ${path}`);
  }
  try {
    return [(yaml.safeLoad(content) as unknown) as R, content];
  } catch (error: unknown) {
    if (error instanceof yaml.YAMLException) {
      throw new AppsembleError(`Error parsing ${path}\n${error.message}`);
    }
    throw error;
  }
}

interface OpenDirSafeOptions {
  allowMissing?: boolean;
  recursive?: boolean;
}

/**
 * Read the contents of a directory.
 *
 * @param directory - The path of the directory to open.
 * @param onFile - A callback which will get called for every file. This will be called with the
 * full file path as its first argument and its `Dirent` object as the second argument.
 * @param options - Additional options.
 */
export async function opendirSafe(
  directory: string,
  onFile: (fullpath: string, stat: Dirent) => Promisable<void>,
  options: OpenDirSafeOptions = {},
): Promise<void> {
  let stats: Stats;
  try {
    stats = await fs.stat(directory);
  } catch (err: unknown) {
    if (options.allowMissing && isErrno(err, 'ENOENT')) {
      return;
    }
    throw new AppsembleError(`Expected ${directory} to be a directory`);
  }
  if (!stats.isDirectory()) {
    throw new AppsembleError(`Expected ${directory} to be a directory`);
  }
  const dir = await fs.opendir(directory);
  for await (const file of dir) {
    const fullPath = join(directory, file.name);
    await onFile(fullPath, file);
    if (options.recursive && file.isDirectory()) {
      await opendirSafe(fullPath, onFile, options);
    }
  }
}
