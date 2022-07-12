import { readFile } from 'fs/promises';
import { join } from 'path';

import fg from 'fast-glob';

/**
 * Discover Appsemble blocks based on workspaces in a monorepo.
 *
 * Both Lerna and Yarn workspaces are supported.
 *
 * @param cwd The project root in which to find workspaces.
 * @returns Discovered Appsemble blocks.
 */
export async function getWorkspaces(cwd: string): Promise<string[]> {
  const { workspaces = [] } = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8'));
  const dirs = await fg(workspaces, {
    cwd,
    absolute: true,
    followSymbolicLinks: true,
    onlyDirectories: true,
  });
  return dirs.sort();
}
