import type { ActionDefinition, BlockDefinition, PageDefinition } from '@appsemble/types';

function findMessageIds(obj: any, result: string[] = []): string[] {
  for (const k in obj) {
    if (k === 'string.format' && obj[k].messageId) {
      result.push(obj[k].messageId);
    } else if (typeof obj[k] === 'object') {
      findMessageIds(obj[k], result);
    }
  }

  return result;
}

export default function getAppMessageIDs(
  pages: PageDefinition[],
  blocks: BlockDefinition[],
  actions: ActionDefinition[],
): string[] {
  const pageIds = pages.map((_, index) => `pages.${index}`);
  const blockIds = findMessageIds(blocks.flatMap((b) => b.parameters));
  const actionIds = findMessageIds(actions);
  return [...actionIds, ...blockIds, ...pageIds];
}
