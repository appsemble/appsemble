import type { BlockManifest } from '@appsemble/types';
import fg from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';

import getBlockConfig from './getBlockConfig';

/**
 * Discover Appsemble blocks based on workspaces in a monorepo.
 *
 * Both Lerna and Yarn workspaces are supported.
 *
 * @param {string} root The project root in which to find workspaces.
 * @returns {Object[]} Discovered Appsemble blocks.
 */
export default async function discoverBlocks(root: string): Promise<Partial<BlockManifest>[]> {
  const {
    // Lerna workspaces
    packages = [],
    // Yarn workspaces
    workspaces = [],
  } = await fs.readJSON(path.resolve(root, 'package.json'));
  const dirs = await fg([].concat(packages, workspaces), {
    absolute: true,
    followSymbolicLinks: true,
    onlyDirectories: true,
  });
  const manifests = await Promise.all(
    dirs
      .concat(root)
      .map(getBlockConfig)
      // Ignore non-block workspaces.
      .map((p) => p.catch(() => null)),
  );
  return manifests.filter(Boolean);
}
