import { getWorkspaces } from '@appsemble/node-utils';

import type { BlockConfig } from '../types';
import getBlockConfig from './getBlockConfig';
/**
 * Discover Appsemble blocks based on workspaces in a monorepo.
 *
 * Both Lerna and Yarn workspaces are supported.
 *
 * @param root The project root in which to find workspaces.
 * @returns Discovered Appsemble blocks.
 */
export default async function discoverBlocks(root: string): Promise<BlockConfig[]> {
  const dirs = await getWorkspaces(root);
  const manifests = await Promise.all(
    dirs
      .concat(root)
      .map(getBlockConfig)
      // Ignore non-block workspaces.
      .map((p) => p.catch(() => null)),
  );
  return manifests.filter(Boolean);
}
