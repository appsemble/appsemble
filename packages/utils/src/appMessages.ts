import { AppDefinition, AppsembleMessages, BlockDefinition } from '@appsemble/types';

import { iterApp, Prefix } from '.';

/**
 * Recursively find `string.format` remapper message IDs.
 *
 * @param obj - The object to search.
 * @returns All message IDs found
 */
export function findMessageIds(obj: unknown): Record<string, string> {
  if (!obj || typeof obj !== 'object') {
    return {};
  }
  if (Array.isArray(obj)) {
    return Object.assign({}, ...obj.map((item) => findMessageIds(item)));
  }
  const entries = Object.entries(obj);
  // Remappers throw if multiple keys are defined, so this means it’s not a remapper.
  if (entries.length === 1) {
    const [[key, value]] = entries;
    if (key === 'string.format' && typeof value?.messageId === 'string') {
      return { [value.messageId]: value.template ?? '' };
    }
    if (key === 'translate') {
      return { [value]: '' };
    }
  }
  return Object.assign({}, ...entries.map(([, value]) => findMessageIds(value)));
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
  onBlock?: (block: BlockDefinition, prefix: Prefix) => void,
): Pick<AppsembleMessages, 'app' | 'messageIds'> {
  const messages: Pick<AppsembleMessages, 'app' | 'messageIds'> = {
    app: {
      name: app.name,
      description: app.description,
      ...Object.fromEntries(
        Object.entries(app.security?.roles ?? {}).flatMap(([role, roleDefinition]) => [
          [`app.roles.${role}`, role],
          [`app.roles.${role}.description`, roleDefinition.description],
        ]),
      ),
    },
    messageIds: {},
  };

  iterApp(app, {
    onBlock(block, prefix) {
      Object.assign(
        messages.messageIds,
        findMessageIds(block.header),
        findMessageIds(block.parameters),
      );

      if (onBlock) {
        onBlock(block, prefix);
      }
    },
    onAction(action) {
      Object.assign(messages.messageIds, findMessageIds(action.remap));
    },
    onPage(page, prefix) {
      messages.app[prefix.join('.')] = page.name;

      if (page.type === 'tabs') {
        page.subPages.forEach((subPage, index) => {
          messages.app[`${prefix.join('.')}.subPages.${index}`] = subPage.name ?? '';
        });
      }
    },
  });

  return messages;
}
