/**
 * Extract all blocks from an app recipe.
 *
 * @param {Object} app The app from which to extract the blocks.
 * @returns {Object<String,Object>} A mapping of paths in the app recipe to blocks. The returned
 *   blocks are the same instance as that in the app recipe.
 */
export default function getAppBlocks(definition) {
  const blocks = {};

  definition.pages.forEach((page, pageIndex) => {
    const parseBlocks = (block, prefix) => {
      blocks[prefix] = block;
      if (!block.actions) {
        return;
      }
      Object.entries(block.actions).forEach(([actionKey, action]) => {
        if (!('blocks' in action)) {
          return;
        }
        action.blocks.forEach((subBlock, index) => {
          parseBlocks(subBlock, `${prefix}.actions.${actionKey}.blocks.${index}`);
        });
      });
    };

    switch (page.type) {
      case 'flow':
      case 'tabs':
        page.subPages.forEach((subPage, index) => {
          subPage.blocks.forEach((block, blockIndex) => {
            parseBlocks(block, `pages.${pageIndex}.subPages.${index}.blocks.${blockIndex}`);
          });
        });
        break;
      default:
        page.blocks.forEach((block, index) =>
          parseBlocks(block, `pages.${pageIndex}.blocks.${index}`),
        );
    }
  });
  return blocks;
}
