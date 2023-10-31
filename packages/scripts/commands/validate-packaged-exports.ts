import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import tar from 'tar';
import { type Argv } from 'yargs';

export const command = 'validate-packaged-exports <paths...>';
export const description = 'Checks for missing files exported by a package.';

export function builder(yargs: Argv): Argv<any> {
  return yargs.positional('paths', {
    describe: 'The path to the package(s) to validate.',
  });
}

export async function handler({ paths }: { paths: string[] }): Promise<void> {
  const normalizedPaths = paths.map((path) => normalizePath(path));
  const files = await fg(normalizedPaths, { absolute: true, onlyFiles: true });

  for (const file of files) {
    if (file.includes('tsconfig')) {
      continue;
    }

    const outDir = file.replace('.tgz', '');
    mkdirSync(outDir);
    await tar.x({
      file,
      C: outDir,
      strip: 1,
    });
    // eslint-disable-next-line no-console
    console.log(`Extracted ${file}\nImporting ${outDir}/index.js`);
    // A child process is required when a bin file is hit to avoid the script
    // getting stuck waiting for user input.
    const child = spawn('node', ['-e', `import("${outDir}/index.js")`]);
    // This will exit when an error was received while importing.
    child.stderr.on('data', (err) => {
      // Ignore required subcommands exiting with code (1)
      if (String(err).includes('<command>')) {
        process.exit(0);
      }
      // eslint-disable-next-line no-console
      console.error(String(err));
      process.exit(1);
    });
  }
}
