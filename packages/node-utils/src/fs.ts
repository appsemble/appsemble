import { Dirent, promises as fs, Stats } from 'fs';
import { join } from 'path';

import { AppsembleError } from '@appsemble/node-utils';
import type { Promisable } from 'type-fest';

interface OpenDirSafeOptions {
  allowMissing?: boolean;
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
  { allowMissing }: OpenDirSafeOptions = {},
): Promise<void> {
  let stats: Stats;
  try {
    stats = await fs.stat(directory);
  } catch (err: unknown) {
    if (allowMissing && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }
    throw new AppsembleError(`Expected ${directory} to be a directory`);
  }
  if (!stats.isDirectory()) {
    throw new AppsembleError(`Expected ${directory} to be a directory`);
  }
  const dir = await fs.opendir(directory);
  for await (const file of dir) {
    await onFile(join(directory, file.name), file);
  }
}
