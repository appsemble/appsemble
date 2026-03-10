import { cp, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { logger, readData, version, writeData } from '@appsemble/node-utils';
import { input, select } from '@inquirer/prompts';
import { type PackageJson } from 'type-fest';
import { type Argv } from 'yargs';

const templateDir = new URL('../../templates/blocks/', import.meta.url);

export const command = 'create';
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
  const templateChoices = await readdir(templateDir);

  const organization =
    args.organization ||
    (await input({
      message: 'For which organization is the block? (default "appsemble")',
    })) ||
    'appsemble';

  const name =
    args.name ||
    (await input({
      message: 'What should be the name of the block?',
    }));

  const path =
    args.path ||
    (await input({
      message:
        'Please enter the path for where you want the block folder to go (default "blocks").',
    })) ||
    join(process.cwd(), 'blocks');

  const template =
    args.template ||
    (await select({
      message: 'What kind of block project should be bootstrapped?',
      choices: templateChoices.map((t) => ({ name: t, value: t })),
    }));

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
