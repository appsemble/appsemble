#!/usr/bin/env node
import { cp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { logger, readData, writeData } from '@appsemble/node-utils';
import { input } from '@inquirer/prompts';
import { type PackageJson } from 'type-fest';

const templatesDir = new URL('templates/', import.meta.url);

function validateProjectName(value: string): boolean | string {
  if (value.length > 30 || value.length === 0) {
    return 'Please input a valid project name. Name must be between 1 and 30 characters long.';
  }
  return true;
}

export async function handler(): Promise<void> {
  const name = await input({
    message: 'Please enter the name of your project.',
    validate: validateProjectName,
  });

  const pathAnswer = await input({
    message: 'Please enter the path for where you want the project folder to go (default ".").',
  });

  const path = pathAnswer || process.cwd();

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

// Only run interactively if stdin is a TTY (not during validation/CI)
if (process.stdin.isTTY) {
  await handler();
}
