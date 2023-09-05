#!/usr/bin/env node
import { cp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { logger, readData, writeData } from '@appsemble/node-utils';
import inquirer from 'inquirer';
import { type PackageJson } from 'type-fest';

const templatesDir = new URL('templates/', import.meta.url);

function validateProjectName(input: string): boolean {
  if (input.length > 30 || input.length === 0) {
    logger.error(
      'Please input a valid project name. Name must be between 1 and 30 characters long.',
    );
    return false;
  }
  return true;
}

export async function handler(): Promise<void> {
  const answers = await inquirer.prompt(
    [
      {
        name: 'name',
        message: 'Please enter the name of your project.',
        validate: validateProjectName,
      },
      {
        name: 'path',
        message: 'Please enter the path for where you want the project folder to go (default ".").',
      },
    ].filter(Boolean),
  );

  const { name } = answers;
  const path = answers.path || process.cwd();

  const outputDirectory = join(path, name);
  const inputDirectory = new URL('gitlab/', templatesDir);

  const pkgPath = new URL('package.json', inputDirectory);

  const [inputPkg] = await readData<PackageJson>(pkgPath);

  const outputPkg = {
    name,
    ...inputPkg,
  };

  const readmePath = new URL('README.md', inputDirectory);

  const inputReadme = await readFile(readmePath, 'utf8');
  const inputReadmeArray = inputReadme.split('\n');
  const outputReadmeArray = [`# ${name}`, ...inputReadmeArray];

  const outputReadme = outputReadmeArray.join('\n');

  await cp(inputDirectory, outputDirectory, {
    errorOnExist: true,
    filter: (src) => !src.endsWith('package.json') || !src.endsWith('README.md'),
    force: false,
    recursive: true,
  });
  await writeData(join(outputDirectory, 'package.json'), outputPkg);
  await writeFile(join(outputDirectory, 'README.md'), outputReadme);

  logger.info(`Successfully created ${name} at ${outputDirectory}`);
}

await handler();
