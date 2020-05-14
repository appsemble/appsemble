import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';

/**
 * Discover Appsemble blocks based on workspaces in a monorepo.
 *
 * Both Lerna and Yarn workspaces are supported.
 *
 * @param root The project root in which to find workspaces.
 * @returns Discovered Appsemble blocks.
 */
export default async function getWorkspaces(cwd: string): Promise<string[]> {
  const { workspaces = [] } = JSON.parse(
    await fs.promises.readFile(path.join(cwd, 'package.json'), 'utf-8'),
  );
  const dirs = await fg(workspaces, {
    cwd,
    absolute: true,
    followSymbolicLinks: true,
    onlyDirectories: true,
  });
  return dirs.sort();
}
