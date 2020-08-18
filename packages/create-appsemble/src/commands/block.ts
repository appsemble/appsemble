import path from 'path';

import fs from 'fs-extra';
import inquirer from 'inquirer';
import type { PackageJson } from 'type-fest';

import { readPackageJson } from '../lib/readPackageJson';

export const command = 'block';
export const description = 'Bootstrap a new Appsemble block.';

export async function handler(): Promise<void> {
  const templateDir = path.resolve(__dirname, '../../templates');
  const choices = await fs.readdir(templateDir);
  const answers = await inquirer.prompt([
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
  const outputPath = path.join(process.cwd(), 'blocks', answers.name);
  const inputPath = path.join(templateDir, answers.type);
  const pkgPath = path.join(inputPath, 'package.json');
  const inputPkg: PackageJson = await fs.readJson(pkgPath);
  const outputPkg = {
    name: `@${answers.organization}/${answers.name}`,
    version,
    ...inputPkg,
  };
  await fs.copy(inputPath, outputPath, { filter: (src) => src !== pkgPath });
  await fs.outputJson(path.join(outputPath, 'package.json'), outputPkg, { spaces: 2 });
}
