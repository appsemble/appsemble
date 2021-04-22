import { AppDefinition, BlockDefinition } from '@appsemble/types';

import { compareStrings, iterApp, Prefix } from '.';

/**
 * Recursively find `string.format` remapper message IDs.
 *
 * @param obj - The object to search.
 * @returns All message IDs found
 */
export function findMessageIds(obj: unknown): string[] {
  if (!obj || typeof obj !== 'object') {
    return [];
  }
  if (Array.isArray(obj)) {
    return obj.flatMap((item) => findMessageIds(item));
  }
  const entries = Object.entries(obj);
  // Remappers throw if multiple keys are defined, so this means it’s not a remapper.
  if (entries.length === 1) {
    const [[key, value]] = entries;
    if (key === 'string.format' && typeof value?.messageId === 'string') {
      return [value.messageId];
    }
  }
  return entries.flatMap(([, value]) => findMessageIds(value));
}

/**
 * Extract translatable message IDs from an app definition.
 *
 * @param app - The app definition to extract nessage IDs from
 * @param onBlock - A function to extract block messages. This is needed, because block messages may
 * be extracted based on different contexts.
 * @returns A list of message IDs
 */
export function extractAppMessages(
  app: AppDefinition,
  onBlock?: (block: BlockDefinition, prefix: Prefix) => string[],
): string[] {
  const messageIds: string[] = [];

  iterApp(app, {
    onBlock(block, prefix) {
      messageIds.push(...findMessageIds(block.header), ...findMessageIds(block.parameters));

      if (onBlock) {
        messageIds.push(...onBlock(block, prefix));
      }
    },
    onAction(action) {
      messageIds.push(...findMessageIds(action.remap));
    },
    onPage(page, prefix) {
      messageIds.push(prefix.join('.'));

      if (page.type === 'tabs') {
        messageIds.push(
          ...page.subPages.map((subPage, index) => `${prefix.join('.')}.subPages.${index}`),
        );
      }
    },
  });

  return [...new Set(messageIds)].sort(compareStrings);
}
