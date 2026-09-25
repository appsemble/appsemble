import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

import { expect, it } from 'vitest';

import { fontAwesomeAliases, fontAwesomeIconNames } from './fontAwesome.js';

const require = createRequire(import.meta.url);

interface IconFamily {
  aliases?: { names?: string[] };
  familyStylesByLicense: { free: unknown[] };
}

it('should match the installed Font Awesome metadata', async () => {
  const metadata: Record<string, IconFamily> = JSON.parse(
    await readFile(
      require.resolve('@fortawesome/fontawesome-free/metadata/icon-families.json'),
      'utf8',
    ),
  );
  const names = new Set<string>();
  const aliases: Record<string, string> = {};
  for (const [name, family] of Object.entries(metadata)) {
    if (family.familyStylesByLicense.free.length) {
      names.add(name);
      for (const alias of family.aliases?.names ?? []) {
        aliases[alias] = name;
      }
    }
  }

  // If this fails, run `npm run scripts -- generate-font-awesome`.
  expect(fontAwesomeIconNames).toStrictEqual(names);
  expect(fontAwesomeAliases).toStrictEqual(aliases);
});
