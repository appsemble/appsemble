import { Dirent, promises as fs, Stats } from 'fs';
import { join } from 'path';

import { Promisable } from 'type-fest';

import { AppsembleError } from '.';

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
    if (options.allowMissing && (err as NodeJS.ErrnoException).code === 'ENOENT') {
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
