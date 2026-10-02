import {
  type AppDefinition,
  getPageMessageId,
  getRouteMessageId,
  normalizeBlockName,
  type PageDefinition,
  translatableRoutes,
} from '@appsemble/lang-sdk';
import { type AppsembleMessages } from '@appsemble/types';

import { extractAppMessages } from './appMessages.js';
import { has } from './miscellaneous.js';
import { normalize } from './normalize.js';

const routeSegmentPattern = /^[A-Z][\dA-Za-z-]*$/;

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

function collectPages(pages: PageDefinition[]): PageDefinition[] {
  return pages.flatMap((page) =>
    page.type === 'container' ? [page, ...collectPages(page.pages)] : [page],
  );
}

/**
 * Validate the URL segments an app serves in a language.
 *
 * The app messages of the language are the extracted defaults of the definition, overlaid by each
 * layer in order. An empty string in a layer keeps the value below it. A page's segment is its
 * normalized translated name, or the normalized page name when the translated name has no Latin
 * letters or digits. A route's segment is its `routes.<Name>` message as written.
 *
 * @param app The app definition the messages belong to.
 * @param language The language the layers are served as, used in the error message.
 * @param layers The stored messages that make up the language, lowest layer first: the base
 *   language row, then the regional row.
 */
export function validateMessageSlugs(
  app: AppDefinition,
  language: string,
  layers: Partial<AppsembleMessages>[],
): void {
  const appMessages = { ...extractAppMessages(app).app };
  for (const layer of layers) {
    for (const [key, value] of Object.entries(layer.app ?? {})) {
      if (typeof value === 'string' && value) {
        appMessages[key] = value;
      }
    }
  }

  const pages = collectPages(app.pages ?? []);
  const canonicalSegments = new Map(pages.map((page) => [normalize(page.name), page]));
  const translatedSegments = new Map<string, PageDefinition>();

  for (const page of pages) {
    const canonical = normalize(page.name);
    // A translated name without Latin letters or digits keeps the canonical segment.
    const segment = normalize(appMessages[getPageMessageId(page.name)]) || canonical;

    if (segment !== canonical) {
      if (segment === 'debug') {
        throw new AppMessageValidationError(
          `Language “${language}”: the translated name of page “${page.name}” has the reserved URL segment “debug”`,
        );
      }
      const other = translatedSegments.get(segment) ?? canonicalSegments.get(segment);
      if (other) {
        throw new AppMessageValidationError(
          `Language “${language}”: pages “${other.name}” and “${page.name}” share the URL segment “${segment}”`,
        );
      }
    }

    translatedSegments.set(segment, page);
  }

  const routeSegments = translatableRoutes.map(
    (name) => [name, appMessages[getRouteMessageId(name)]] as const,
  );

  for (const [name, segment] of routeSegments) {
    if (segment === name) {
      continue;
    }
    if (!routeSegmentPattern.test(segment)) {
      throw new AppMessageValidationError(
        `Language “${language}”: the URL segment “${segment}” of route “${name}” must start with an uppercase letter and may only contain letters, digits and hyphens`,
      );
    }
    if (segment === 'Callback' || segment.toLowerCase() === 'debug') {
      throw new AppMessageValidationError(
        `Language “${language}”: the URL segment “${segment}” of route “${name}” is reserved`,
      );
    }
    const other = routeSegments.find(
      ([otherName, otherSegment]) =>
        otherName !== name && (segment === otherName || segment === otherSegment),
    );
    if (other) {
      throw new AppMessageValidationError(
        `Language “${language}”: routes “${name}” and “${other[0]}” share the URL segment “${segment}”`,
      );
    }
  }
}
