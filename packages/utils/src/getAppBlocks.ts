import { AppDefinition, BlockDefinition } from '@appsemble/types';

import { iterApp } from './iterApp';

export type BlockMap = Record<string, BlockDefinition>;

/**
 * Extract all blocks from an app definition.
 *
 * @param definition - The app from which to extract the blocks.
 * @returns A mapping of paths in the app definition to blocks. The returned blocks are the same
 * instance as that in the app definition.
 */
export function getAppBlocks(definition: AppDefinition): BlockMap {
  const blocks: BlockMap = {};

  iterApp(definition, {
    onBlock(block, prefix) {
      blocks[prefix.join('.')] = block;
    },
  });

  return blocks;
}
