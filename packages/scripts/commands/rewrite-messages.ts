import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AppsembleError, logger } from '@appsemble/node-utils';
import { compareStrings } from '@appsemble/utils';

/**
 * This script aims to help keep existing translations if a messages file has been moved.
 *
 * Running this script requires these replacements to have been implemented.
 *
 * The following example shows how to fix up messages if a messages file is renamed from
 * `packages/studio/src/components/AppContext/messages.ts` to
 * `packages/studio/src/pages/apps/app/messages.ts`.
 *
 * @example
 * ```ts
 * const replacements = [
 *   [/^studio\.src\.components\.AppContext\.(.*)/, 'studio.src.pages.apps.app.$1'],
 * ];
 * ```
 *
 * Now running the following command will fix the message keys:
 * @example
 * ```sh
 * npm run scripts -- rewrite-messages
 * ```
 */
const replacements: [RegExp, string][] = [];

const filename = fileURLToPath(import.meta.url);
export const command = 'rewrite-messages';
export const description = `Fix i18n message keys for moved files. Open ${filename} for details`;

const translationdDir = 'i18n';

export async function handler(): Promise<void> {
  const filenames = await readdir(translationdDir);

  if (!replacements.length) {
    throw new AppsembleError(`Implement replacements in ${filename} to run this command.`);
  }

  await Promise.all(
    filenames.map(async (filepath) => {
      const path = join(translationdDir, filepath);
      const pldMessages = JSON.parse(await readFile(path, 'utf8'));
      const newMessages = Object.fromEntries(
        Object.entries(pldMessages).map(([oldKey, value]) => {
          const replacement = replacements.find(([pattern]) => pattern.test(oldKey));
          if (replacement) {
            const newKey = oldKey.replace(...replacement);
            logger.info(`${path}: ${oldKey} → ${newKey}`);
            return [newKey, value];
          }
          return [oldKey, value];
        }),
      );
      await writeFile(
        path,
        `${JSON.stringify(newMessages, Object.keys(newMessages).sort(compareStrings), 2)}\n`,
      );
    }),
  );
}
