import { BlockManifest } from '@appsemble/types';
import { IdentifiableBlock } from '@appsemble/utils';
import axios from 'axios';

const blockMap = new Map<string, Promise<BlockManifest>>();

/**
 * Fetch and cache block manifests usng a local cache.
 *
 * @param blocks - Identifiable blocks to get the manifest for.
 * @returns A list of block manifest that match the block manifests. If not matching manifest is
 * found, it’s ignored.
 */
export async function getCachedBlockVersions(
  blocks: IdentifiableBlock[],
): Promise<BlockManifest[]> {
  const manifests = await Promise.all(
    blocks.map(({ type, version }) => {
      const url = `/api/blocks/${type}/versions/${version}`;
      if (!blockMap.has(url)) {
        blockMap.set(
          url,
          axios.get<BlockManifest>(url).then(
            ({ data }) => data,
            // Don’t crash if the user enters an unknown block version.
            () => null,
          ),
        );
      }
      return blockMap.get(url);
    }),
  );
  return manifests.filter(Boolean);
}
