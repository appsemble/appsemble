import { glob, readFile } from 'node:fs/promises';

import { IntlMessageFormat } from 'intl-messageformat';
import { describe, expect, it } from 'vitest';

const repositoryRoot = new URL('../../', import.meta.url);

/**
 * Collect every message that can’t be parsed as ICU.
 *
 * Messages are nested objects in app translations and flat in the other translation files.
 *
 * @param value The message or group of messages to check.
 * @param path The key path of the message, used to report where an invalid message lives.
 * @param file The translation file the message came from.
 * @param errors The errors collected so far.
 */
function collectErrors(value: unknown, path: string, file: string, errors: string[]): void {
  if (typeof value === 'string') {
    if (!value) {
      return;
    }
    try {
      new IntlMessageFormat(value).getAst();
    } catch (error: any) {
      errors.push(`${file} ${path}: ${error.message.split('\n')[0]}`);
    }
  } else if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      collectErrors(nested, path ? `${path}.${key}` : key, file, errors);
    }
  }
}

describe('translations', () => {
  it('should contain valid ICU messages', async () => {
    const errors: string[] = [];

    for await (const file of glob(['i18n/*.json', 'apps/*/i18n/*.json', 'blocks/*/i18n/*.json'], {
      cwd: repositoryRoot,
    })) {
      const messages = JSON.parse(await readFile(new URL(file, repositoryRoot), 'utf8'));
      collectErrors(messages, '', file, errors);
    }

    expect(errors).toStrictEqual([]);
  });
});
