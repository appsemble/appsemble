import { type AppDefinition } from '@appsemble/lang-sdk';
import { throwKoaError } from '@appsemble/node-utils';
import { type AppsembleMessages } from '@appsemble/types';
import { AppMessageValidationError, validateMessageSlugs } from '@appsemble/utils';
import { type Context } from 'koa';
import tags from 'language-tags';

/**
 * Get the base language of a language tag, for example `nl` for `nl-be`.
 *
 * @param language The lowercased language tag.
 * @returns The lowercased base language, which equals the input for a bare language.
 */
export function getBaseLanguage(language: string): string {
  return String(
    tags(language)
      .subtags()
      .find((sub) => sub.type() === 'language'),
  ).toLowerCase();
}

/**
 * Collect the languages whose served messages change when the given languages are written.
 *
 * A written language is affected, and so is every stored regional language whose base language is
 * written, because the regional language layers on top of its base.
 *
 * @param written The lowercased languages being written.
 * @param stored The lowercased languages stored for the app.
 * @returns The affected languages.
 */
export function getAffectedLanguages(
  written: Iterable<string>,
  stored: Iterable<string>,
): string[] {
  const affected = new Set(written);
  for (const language of stored) {
    const base = getBaseLanguage(language);
    if (base !== language && affected.has(base)) {
      affected.add(language);
    }
  }
  return [...affected];
}

/**
 * Reject the request when a language serves colliding translated URL segments.
 *
 * Each language is checked against the messages it serves: the extracted defaults of the
 * definition, overlaid by the base language row and the regional row.
 *
 * @param ctx The Koa context to reject with a 400 error.
 * @param definition The app definition the messages belong to.
 * @param messagesByLanguage The app messages by lowercased language.
 * @param languages The lowercased languages to check.
 */
export function assertMessageSlugs(
  ctx: Context,
  definition: AppDefinition,
  messagesByLanguage: ReadonlyMap<string, Partial<AppsembleMessages> | undefined>,
  languages: Iterable<string>,
): void {
  for (const language of languages) {
    const base = getBaseLanguage(language);
    const layers = [
      base === language ? undefined : messagesByLanguage.get(base),
      messagesByLanguage.get(language),
    ].filter((layer): layer is Partial<AppsembleMessages> => layer != null);
    try {
      validateMessageSlugs(definition, language, layers);
    } catch (error) {
      if (error instanceof AppMessageValidationError) {
        throwKoaError(ctx, 400, error.message);
      }
      throw error;
    }
  }
}
