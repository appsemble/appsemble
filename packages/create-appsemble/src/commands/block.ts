import { promises as fs } from 'fs';
import { join, resolve } from 'path';

import { logger, readData, writeData } from '@appsemble/node-utils';
import { copy } from 'fs-extra';
import { prompt } from 'inquirer';
import { PackageJson } from 'type-fest';
import { Argv } from 'yargs';

import { readPackageJson } from '../lib/readPackageJson';

const templateDir = resolve(__dirname, '../../templates');

export const command = 'block';
export const description = 'Bootstrap a new Appsemble block.';

interface BlockArgs {
  organization?: string;
  name?: string;
  template?: string;
}

export async function builder(yargs: Argv): Promise<Argv<any>> {
  const choices = await fs.readdir(templateDir);

  return yargs
    .option('organization', {
      describe: 'The ID the block should be created for.',
    })
    .option('name', {
      describe: 'The name of the block',
    })
    .option('template', {
      describe: 'The template to use.',
      choices,
    });
}

export async function handler(args: BlockArgs): Promise<void> {
  const choices = await fs.readdir(templateDir);
  const answers = await prompt(
    [
      !args.organization && {
        name: 'organization',
        message: 'For which organization is the block?',
      },
      !args.name && { name: 'name', message: 'What should be the name of the block?' },
      !args.template && {
        name: 'template',
        type: 'list',
        choices,
        message: 'What kind of block project should be bootstrapped?',
      },
    ].filter(Boolean),
  );

  const organization = answers.organization || args.organization;
  const name = answers.name || args.name;
  const template = answers.template || args.template;

  const { version } = await readPackageJson();
  const outputPath = join(process.cwd(), 'blocks', name);
  const inputPath = join(templateDir, template);
  const pkgPath = join(inputPath, 'package.json');
  const [inputPkg] = await readData<PackageJson>(pkgPath);
  const outputPkg = {
    name: `@${organization}/${name}`,
    version,
    ...inputPkg,
  };
  await copy(inputPath, outputPath, { filter: (src) => src !== pkgPath });
  await writeData(join(outputPath, 'package.json'), outputPkg);
  logger.info(`Successfully created @${organization}/${name}/${version} at ${outputPath}`);
}
