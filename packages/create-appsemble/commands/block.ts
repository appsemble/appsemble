import { cp, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { logger, readData, writeData } from '@appsemble/node-utils';
import inquirer from 'inquirer';
import { type PackageJson } from 'type-fest';
import { type Argv } from 'yargs';

import pkg from '../package.json' assert { type: 'json' };

const templateDir = new URL('../templates/blocks/', import.meta.url);

export const command = 'block';
export const description = 'Bootstrap a new Appsemble block.';

interface BlockArgs {
  organization?: string;
  name?: string;
  path?: string;
  template?: string;
}

export async function builder(yargs: Argv): Promise<Argv<any>> {
  const choices = await readdir(templateDir);

  return yargs
    .option('organization', {
      describe: 'The ID of the organization block should be created for.',
    })
    .option('name', {
      describe: 'The name of the block',
    })
    .option('path', {
      describe: 'Path of the folder where you want to put your block.',
    })
    .option('template', {
      describe: 'The template to use.',
      choices,
    });
}

export async function handler(args: BlockArgs): Promise<void> {
  const choices = await readdir(templateDir);
  const answers = await inquirer.prompt(
    [
      !args.organization && {
        name: 'organization',
        message: 'For which organization is the block? (default "appsemble")',
      },
      !args.name && { name: 'name', message: 'What should be the name of the block?' },
      !args.path && {
        name: 'path',
        message:
          'Please enter the path for where you want the block folder to go (default "blocks").',
      },
      !args.template && {
        name: 'template',
        type: 'list',
        choices,
        message: 'What kind of block project should be bootstrapped?',
      },
    ].filter(Boolean),
  );

  const organization = answers.organization || args.organization || 'appsemble';
  const name = answers.name || args.name;
  const template = answers.template || args.template;
  const path = answers.path || args.path || join(process.cwd(), 'blocks');

  const { version } = pkg;
  const outputPath = join(path, name);
  const inputPath = new URL(`${template}/`, templateDir);
  const pkgPath = new URL('package.json', inputPath);
  const [inputPkg] = await readData<PackageJson>(pkgPath);
  const outputPkg = {
    name: `@${organization}/${name}`,
    version,
    ...inputPkg,
  };
  await cp(inputPath, outputPath, {
    errorOnExist: true,
    filter: (src) => !src.endsWith('package.json'),
    force: false,
    recursive: true,
  });
  await writeData(join(outputPath, 'package.json'), outputPkg);
  logger.info(`Successfully created @${organization}/${name}/${version} at ${outputPath}`);
}
