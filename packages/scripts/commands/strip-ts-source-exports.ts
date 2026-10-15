import { readFile, writeFile } from 'node:fs/promises';

import { logger } from '@appsemble/node-utils';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { type Argv } from 'yargs';

export const command = 'strip-ts-source-exports <paths...>';
export const description = `Remove the \`ts-source\` export condition from package.json files.

The \`ts-source\` condition resolves \`@appsemble/*\` imports to their TypeScript source, which only
exists inside this monorepo. Published packages ship the compiled output, so the condition must be
removed before packing; otherwise consumers that build with \`@appsemble/webpack-config\` (whose
resolver prefers \`ts-source\`) fail to resolve the package.`;

export function builder(yargs: Argv): Argv<any> {
  return yargs.positional('paths', {
    describe: 'The package.json files to process.',
    type: 'string',
  });
}

export async function handler({ paths }: { paths: string[] }): Promise<void> {
  const normalizedPaths = paths.map((path) => normalizePath(path));
  const files = await fg(normalizedPaths, { absolute: true, onlyFiles: true });

  for (const file of files) {
    const pkg = JSON.parse(await readFile(file, 'utf8'));
    const { exports: exportsMap } = pkg;
    if (!exportsMap || typeof exportsMap !== 'object') {
      continue;
    }

    let stripped = false;
    for (const entry of Object.values(exportsMap)) {
      if (entry && typeof entry === 'object' && 'ts-source' in entry) {
        delete (entry as Record<string, unknown>)['ts-source'];
        stripped = true;
      }
    }

    if (stripped) {
      await writeFile(file, `${JSON.stringify(pkg, null, 2)}\n`);
      logger.info(`Stripped \`ts-source\` exports from ${file}`);
    }
  }
}
