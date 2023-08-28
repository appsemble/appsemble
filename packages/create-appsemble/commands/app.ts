import { cp, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { logger, readData, writeData } from '@appsemble/node-utils';
import { type AppDefinition, type AppsembleRC } from '@appsemble/types';
import inquirer from 'inquirer';
import { parse, stringify } from 'yaml';
import { type Argv } from 'yargs';

const templatesDir = new URL('../templates/apps/', import.meta.url);

export const command = 'app';
export const description = 'Scaffold a new app with default definition and styling.';

interface AppArgs {
  path?: string;
  name?: string;
  organization?: string;
  template?: string;
  languages?: string[];
  description?: string;
}

export async function builder(yargs: Argv): Promise<Argv<any>> {
  const templateChoices = await readdir(templatesDir);
  const languageChoices = ['en', 'nl', 'ru', 'fr', 'de', 'da', 'id', 'hr'];
  return yargs
    .option('path', {
      describe: 'Path of the folder where you want to put your app.',
    })
    .option('name', {
      describe: 'The name of the app.',
    })
    .option('organization', {
      describe: 'The Organization ID app should be created for.',
    })
    .option('description', {
      describe: 'The description of the app.',
    })
    .option('template', {
      describe: 'The template to use.',
      choices: templateChoices,
    })
    .option('languages', {
      describe: 'Languages in which the app will be translated.',
      choices: languageChoices,
    });
}

function validateAppName(input: string): boolean {
  if (input.length > 30 || input.length === 0) {
    logger.error('Please input a valid app name. Name must be between 1 and 30 characters long.');
    return false;
  }
  return true;
}

export async function handler(args: AppArgs): Promise<void> {
  const templateChoices = await readdir(templatesDir);
  const languageChoices = ['en', 'nl', 'ru', 'fr', 'de', 'da', 'id', 'hr'];
  const answers = await inquirer.prompt(
    [
      !args.organization && {
        name: 'organization',
        message: 'For which organisation is this app?(default "appsemble")',
      },
      !args.name && {
        name: 'name',
        message: 'What will be the name of the app.',
        validate: validateAppName,
      },
      !args.description && {
        name: 'description',
        message: 'Please describe your app.',
      },
      !args.template && {
        name: 'template',
        type: 'list',
        choices: templateChoices,
        message: 'Please choose a template to continue.',
      },
      !args.languages && {
        name: 'languages',
        type: 'checkbox',
        choices: languageChoices,
        message: 'Please select the languages for your app.',
      },
      !args.path && {
        name: 'path',
        message: 'Please enter the path for where you want the app folder to go (default "apps").',
      },
    ].filter(Boolean),
  );
  const path = args.path || answers.path || join(process.cwd(), 'apps');
  const organization = answers.organization || args.organization || 'appsemble';
  const name = answers.name || args.name;
  const appDescription = answers.description || args.description || '';
  const template = answers.template || args.template;
  const languages = answers.languages || args.languages;

  const outputDirectory = join(path, name);
  const inputDirectory = new URL(`${template}/`, templatesDir);
  const appsembleRcPath = new URL('.appsemblerc.yaml', inputDirectory);
  const [appsembleRc] = await readData<AppsembleRC>(appsembleRcPath);
  const outputAppsembleRcObject: AppsembleRC = { ...appsembleRc };
  for (const key of Object.keys(appsembleRc.context)) {
    outputAppsembleRcObject.context[key].organization = organization;
  }
  const outputAppsembleRc = parse(stringify(outputAppsembleRcObject));
  const appDefinitionPath = new URL('app-definition.yaml', inputDirectory);
  const [appDefinition] = await readData<AppDefinition>(appDefinitionPath);

  const outputAppDefinitionObject = { ...appDefinition };

  outputAppDefinitionObject.name = name;
  outputAppDefinitionObject.description = appDescription;

  const outputAppDefinition = parse(stringify(outputAppDefinitionObject));

  await cp(inputDirectory, outputDirectory, {
    errorOnExist: true,
    filter: (src) => !src.endsWith('.appsemblerc.yaml') || !src.endsWith('app-definition.yaml'),
    force: false,
    recursive: true,
  });
  for (const language of languages) {
    await writeData(join(outputDirectory, 'i18n', `${language}.json`), {});
  }
  await writeData(join(outputDirectory, '.appsemblerc.yaml'), outputAppsembleRc);
  await writeData(join(outputDirectory, 'app-definition.yaml'), outputAppDefinition, {
    sort: false,
  });
  logger.info(`Successfully created ${name} at ${outputDirectory}`);
}
