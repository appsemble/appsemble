import type { AppDefinition, BlockDefinition } from '@appsemble/types';

import { iterApp } from './iterApp';

export interface BlockMap {
  [path: string]: BlockDefinition;
}

/**
 * Extract all blocks from an app recipe.
 *
 * @param app The app from which to extract the blocks.
 * @returns A mapping of paths in the app recipe to blocks. The returned blocks are the same
 *    instance as that in the app recipe.
 */
export default function getAppBlocks(definition: AppDefinition): BlockMap {
  const blocks: BlockMap = {};

  iterApp(definition, {
    onBlock(block, prefix) {
      blocks[prefix.join('.')] = block;
    },
  });

  return blocks;
}
