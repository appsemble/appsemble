import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

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
    await mkdir(outDir);
    await tar.x({
      file,
      C: outDir,
      strip: 1,
    });
    // eslint-disable-next-line no-console
    console.log(`Extracted ${file}\nImporting ${outDir}/index.js`);

    const packageJson = JSON.parse(await readFile(join(outDir, 'package.json'), 'utf8'));
    packageJson.devDependencies = {};
    await writeFile(join(outDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    // eslint-disable-next-line no-console
    console.log(`Rewrote package.json in ${outDir}`);

    // eslint-disable-next-line no-console
    console.log('Installing package dependencies in local folder');
    // TODO: find more efficient way to handle monorepo dependency stuff here
    // dependencies are fractured between main node_modules folder and workspace folders, which
    // did not happen with yarn
    const installChild = spawn('npm', ['install', '--omit=dev'], { cwd: outDir });
    await new Promise((resolve, reject) => {
      installChild.on('error', (err) => {
        // eslint-disable-next-line no-console
        console.error(err);
        reject(err);
        process.exit(1);
      });
      installChild.on('exit', resolve);
    });
    // eslint-disable-next-line no-console
    console.log('Installed package dependencies in local folder');

    // A child process is required when a bin file is hit to avoid the script
    // getting stuck waiting for user input.
    const child = spawn('node', ['-e', 'import("./index.js")'], {
      cwd: outDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        NODE_NO_WARNINGS: '1',
      },
    });
    // This will exit when an error was received while importing.
    try {
      await new Promise<void>((resolve, reject) => {
        child.stderr.on('data', (err) => {
          // Ignore required subcommands exiting with code (1)
          if (String(err).includes('<command>')) {
            // eslint-disable-next-line no-console
            console.log('CLI command printed usage help, ignoring');
            child.kill();
            resolve();
          } else {
            reject(err);
          }
        });
        child.on('exit', resolve);
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(String(error));
      // eslint-disable-next-line no-console
      console.log('EXITING');
      process.exit(1);
    }
  }
}
