import {
  type AppDefinition,
  type BlockDefinition,
  iterApp,
  type Prefix,
} from '@appsemble/lang-sdk';
import { type AppsembleMessages } from '@appsemble/types';

import { normalize } from './normalize.js';

/**
 * Recursively find `string.format` remapper message IDs.
 *
 * @param obj The object to search.
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
      return { [value.messageId]: value.template ?? '', ...findMessageIds(value.values) };
    }
    if (key === 'translate' && typeof value === 'string') {
      return { [value]: '' };
    }
  }
  return Object.assign({}, ...entries.map(([, value]) => findMessageIds(value)));
}

/**
 * Extract translatable message IDs from an app definition.
 *
 * @param app The app definition to extract message IDs from
 * @param onBlock A function to extract block messages. This is needed, because block messages may
 *   be extracted based on different contexts.
 * @returns A list of message IDs
 */
export function extractAppMessages(
  app: AppDefinition,
  onBlock?: (block: BlockDefinition, prefix: Prefix) => void,
): Pick<AppsembleMessages, 'app' | 'messageIds'> {
  const messages: Pick<AppsembleMessages, 'app' | 'messageIds'> = {
    app: {
      name: app.name,
      description: app.description ?? '',
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
        const normalizedPrefix = prefix.map((entry, index) =>
          index === 1 ? normalize(app.pages[entry as number].name) : entry,
        );
        onBlock(block, normalizedPrefix);
      }
    },
    onAction(action) {
      Object.assign(messages.messageIds, findMessageIds(action.remapBefore));
      Object.assign(messages.messageIds, findMessageIds(action.remapAfter));

      switch (action.type) {
        case 'condition':
          Object.assign(messages.messageIds, findMessageIds(action.if));
          Object.assign(messages.messageIds, findMessageIds(action.then));
          Object.assign(messages.messageIds, findMessageIds(action.else));
          break;
        case 'dialog':
          Object.assign(messages.messageIds, findMessageIds(action.title));
          break;
        case 'email':
          Object.assign(
            messages.messageIds,
            findMessageIds(action.attachments),
            findMessageIds(action.bcc),
            findMessageIds(action.body),
            findMessageIds(action.cc),
            findMessageIds(action.subject),
            findMessageIds(action.to),
          );
          break;
        case 'flow.to':
          Object.assign(messages.messageIds, findMessageIds(action.step));
          break;
        case 'message':
          Object.assign(messages.messageIds, findMessageIds(action.body));
          break;
        case 'request':
        case 'resource.count':
        case 'resource.create':
        case 'resource.delete':
        case 'resource.get':
        case 'resource.query':
        case 'resource.update':
          Object.assign(
            messages.messageIds,
            findMessageIds(action.body),
            findMessageIds(action.query),
            findMessageIds(action.url),
          );
          break;
        case 'share':
          Object.assign(
            messages.messageIds,
            findMessageIds(action.text),
            findMessageIds(action.title),
            findMessageIds(action.url),
          );
          break;
        default:
      }
    },
    onPage(page) {
      const prefix = `pages.${normalize(page.name)}`;
      messages.app[prefix] = page.name;

      if (page.type === 'tabs' && Array.isArray(page.tabs)) {
        for (const [index, tab] of page.tabs.entries()) {
          messages.app[`${prefix}.tabs.${index}`] =
            (typeof tab.name === 'string' ? tab.name : '') ?? '';
        }
      }

      if (page.type === 'flow') {
        for (const [index, step] of page.steps.entries()) {
          messages.app[`${prefix}.steps.${index}`] =
            (typeof step.name === 'string' ? step.name : '') ?? '';
        }
      }

      if (page.type === 'loop') {
        messages.app[`${prefix}.steps.first`] = 'first';
        messages.app[`${prefix}.steps`] = 'step';
        messages.app[`${prefix}.steps.last`] = 'last';
      }
    },
  });

  return messages;
}
