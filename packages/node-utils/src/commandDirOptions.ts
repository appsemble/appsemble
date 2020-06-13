import path from 'path';
import type { RequireDirectoryOptions } from 'yargs';

/**
 * Generate `yargs.commandDir()` options based on a filename.
 *
 * The passed filename must match the directory name in which to look for subcommands.
 *
 * The extension is set correctly for JavaScript and TypeScript files automatically.
 *
 * @param filename The filename for which to get command dir options.
 */
export default function commandDirOptions(filename: string): [string, RequireDirectoryOptions] {
  const { dir, ext, name } = path.parse(filename);
  return [path.join(dir, name), { extensions: [ext.slice(1)] }];
}
