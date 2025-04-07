import { type AppDefinition, type AppsembleMessages } from '@appsemble/types';

import { extractAppMessages } from './appMessages.js';
import { normalizeBlockName } from './blockUtils.js';
import { has } from './miscellaneous.js';

export class AppMessageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppMessageValidationError';
  }
}

export function validateMessages(messages: AppsembleMessages, app: AppDefinition): void {
  const blockMessageKeys: AppsembleMessages['blocks'] = {};
  const extractedMessages = extractAppMessages(app, (block) => {
    const type = normalizeBlockName(block.type);
    if (blockMessageKeys[type]) {
      blockMessageKeys[type][block.version] = {};
    } else {
      blockMessageKeys[type] = {
        [block.version]: {},
      };
    }
  });
  if (messages.messageIds) {
    Object.keys(messages.messageIds).map((key) => {
      if (typeof messages.messageIds[key] !== 'string') {
        throw new AppMessageValidationError(
          `Not allowed to have non-string message ${messages.messageIds[key]}`,
        );
      }
    });
  }
  if (messages.app) {
    Object.keys(messages.app).map((key) => {
      const blockMatch = /^(pages\.[\dA-Za-z-]+(\..+)?)\.blocks\.\d+.+/.exec(key);
      const emailMatch =
        /emails\.(appInvite|appMemberEmailChange|emailAdded|groupInvite|resend|reset|welcome)\.(body|subject)/.exec(
          key,
        );
      if (
        (!has(extractedMessages?.app, key) || typeof messages.app[key] !== 'string') &&
        !blockMatch &&
        !emailMatch
      ) {
        throw new AppMessageValidationError(`Invalid key ${key}`);
      }
    });
  }
  const blockMessages: AppsembleMessages['blocks'] = {};
  if (messages.blocks) {
    for (const key of Object.keys(messages.blocks)) {
      if (!has(blockMessageKeys, key)) {
        throw new AppMessageValidationError(
          `Invalid translation key: blocks.${key}\nThis block is not used in the app`,
        );
      }
    }
  }

  const coreMessages = messages.core ?? {};
  for (const [key, value] of Object.entries(coreMessages)) {
    if (typeof value !== 'string') {
      throw new AppMessageValidationError(`Invalid translation key: core.${key}`);
    }
  }

  for (const [blockName] of Object.entries(blockMessageKeys)) {
    if (messages.blocks?.[blockName]) {
      blockMessages[blockName] = {};

      for (const [version, oldValues] of Object.entries(messages.blocks[blockName])) {
        if (!has(blockMessageKeys[blockName], version)) {
          throw new AppMessageValidationError(
            `Invalid translation key: blocks.${blockName}.${version}
This block version is not used in the app`,
          );
        }

        for (const [oldValueKey, oldValue] of Object.entries(messages.blocks[blockName][version])) {
          if (typeof oldValue !== 'string') {
            throw new AppMessageValidationError(
              `Invalid translation key: blocks.${blockName}.${version}.${oldValueKey}`,
            );
          }
          blockMessages[blockName][version] = oldValues;
        }
      }
    }
  }
}
