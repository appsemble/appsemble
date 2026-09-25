import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { logger } from '@appsemble/node-utils';
import prettier from 'prettier';

export const command = 'generate-font-awesome';
export const description = 'Generate the Font Awesome name module of @appsemble/lang-sdk';

interface IconFamily {
  aliases?: { names?: string[] };
  familyStylesByLicense: { free: unknown[] };
}

export async function handler(): Promise<void> {
  const require = createRequire(import.meta.url);
  const { version } = require('@fortawesome/fontawesome-free/package.json');
  const metadata: Record<string, IconFamily> = JSON.parse(
    await readFile(
      require.resolve('@fortawesome/fontawesome-free/metadata/icon-families.json'),
      'utf8',
    ),
  );

  const names: string[] = [];
  const aliases: [string, string][] = [];
  for (const [name, family] of Object.entries(metadata)) {
    if (!family.familyStylesByLicense.free.length) {
      continue;
    }
    names.push(name);
    for (const alias of family.aliases?.names ?? []) {
      aliases.push([alias, name]);
    }
  }
  names.sort();
  aliases.sort(([a], [b]) => a.localeCompare(b));

  const source = `// Generated from @fortawesome/fontawesome-free ${version} by \`npm run scripts -- generate-font-awesome\`.
// Don't edit by hand.

/**
 * Font Awesome alias names, mapped to the name of the icon they render.
 */
export const fontAwesomeAliases: Record<string, string> = {
${aliases.map(([alias, name]) => `  ${JSON.stringify(alias)}: ${JSON.stringify(name)},`).join('\n')}
};

/**
 * The names of the icons in the free Font Awesome set, without aliases.
 */
export const fontAwesomeIconNames = new Set<string>([
${names.map((name) => `  ${JSON.stringify(name)},`).join('\n')}
]);
`;
  const filepath = join(process.cwd(), 'packages', 'lang-sdk', 'fontAwesome.ts');
  const prettierConfig = await prettier.resolveConfig(filepath, { editorconfig: true });
  await writeFile(filepath, await prettier.format(source, { ...prettierConfig, filepath }));
  logger.info(`Wrote ${names.length} icon names and ${aliases.length} aliases to ${filepath}`);
}
