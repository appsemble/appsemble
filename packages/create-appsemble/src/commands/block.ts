import { promises as fs } from 'fs';
import { join, resolve } from 'path';

import { copy, outputJson, readJson } from 'fs-extra';
import { prompt } from 'inquirer';
import type { PackageJson } from 'type-fest';

import { readPackageJson } from '../lib/readPackageJson';

export const command = 'block';
export const description = 'Bootstrap a new Appsemble block.';

export async function handler(): Promise<void> {
  const templateDir = resolve(__dirname, '../../templates');
  const choices = await fs.readdir(templateDir);
  const answers = await prompt([
    { name: 'organization', message: 'For which organization is the block?' },
    { name: 'name', message: 'What should be the name of the block?' },
    {
      name: 'type',
      type: 'list',
      choices,
      message: 'What kind of block project should be bootstrapped?',
    },
  ]);
  const { version } = await readPackageJson();
  const outputPath = join(process.cwd(), 'blocks', answers.name);
  const inputPath = join(templateDir, answers.type);
  const pkgPath = join(inputPath, 'package.json');
  const inputPkg: PackageJson = await readJson(pkgPath);
  const outputPkg = {
    name: `@${answers.organization}/${answers.name}`,
    version,
    ...inputPkg,
  };
  await copy(inputPath, outputPath, { filter: (src) => src !== pkgPath });
  await outputJson(join(outputPath, 'package.json'), outputPkg, { spaces: 2 });
}
