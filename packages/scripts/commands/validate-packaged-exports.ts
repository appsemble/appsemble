import { spawn } from 'node:child_process';
import { access, cp, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { x as tarExtract } from 'tar';
import { type Argv } from 'yargs';

export const command = 'validate-packaged-exports <paths...>';
export const description = 'Checks for missing files exported by a package.';

/**
 * Recursively collect the relative file targets referenced by a package.json `exports` value.
 *
 * @param value An `exports` entry, which may be a string target or a nested conditions object.
 * @param targets The set to collect relative (`./…`) targets into.
 */
function collectExportTargets(value: unknown, targets: Set<string>): void {
  if (typeof value === 'string') {
    if (value.startsWith('./')) {
      targets.add(value);
    }
  } else if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) {
      collectExportTargets(nested, targets);
    }
  }
}

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
    await tarExtract({
      file,
      C: outDir,
      strip: 1,
    });
    console.log(`Extracted ${file}\nImporting ${outDir}/index.js`);

    const packageJson = JSON.parse(await readFile(join(outDir, 'package.json'), 'utf8'));

    // Every file referenced by an export condition must be shipped in the package. This guards
    // against conditions like `ts-source` (pointing at TypeScript source that isn't published)
    // leaking into a published package and breaking consumers that resolve them.
    const exportTargets = new Set<string>();
    collectExportTargets(packageJson.exports, exportTargets);
    for (const target of exportTargets) {
      const exists = await access(join(outDir, target))
        .then(() => true)
        .catch(() => false);
      if (!exists) {
        console.error(`Export target ${target} is missing from ${file}`);
        process.exit(1);
      }
    }

    const nodeModulesPath = join(process.cwd(), packageJson.repository.directory, 'node_modules');
    const outDirNodeModulesPath = join(outDir, 'node_modules');
    if (
      await access(nodeModulesPath)
        .then(() => true)
        .catch(() => false)
    ) {
      console.log(`Copying node_modules from ${nodeModulesPath} to ${outDirNodeModulesPath}`);
      await mkdir(outDirNodeModulesPath, { recursive: true });
      await cp(nodeModulesPath, outDirNodeModulesPath, { recursive: true });
    }

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
      console.error(String(error));
      console.log('EXITING');
      process.exit(1);
    }
  }
}
