import { promises as fs } from 'fs';
import { join } from 'path';

import fg from 'fast-glob';

/**
 * Discover Appsemble blocks based on workspaces in a monorepo.
 *
 * Both Lerna and Yarn workspaces are supported.
 *
 * @param cwd - The project root in which to find workspaces.
 * @returns Discovered Appsemble blocks.
 */
export async function getWorkspaces(cwd: string): Promise<string[]> {
  const { workspaces = [] } = JSON.parse(await fs.readFile(join(cwd, 'package.json'), 'utf-8'));
  const dirs = await fg(workspaces, {
    cwd,
    absolute: true,
    followSymbolicLinks: true,
    onlyDirectories: true,
  });
  return dirs.sort();
}
