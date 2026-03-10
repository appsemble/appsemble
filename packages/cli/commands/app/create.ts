import { cp, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { logger, readData, writeData } from '@appsemble/node-utils';
import { type AppsembleRC } from '@appsemble/types';
import { checkbox, confirm, input, select } from '@inquirer/prompts';
import { format } from 'prettier';
import { parse, parseDocument, stringify } from 'yaml';
import { type Argv } from 'yargs';

const templatesDir = new URL('../../templates/apps/', import.meta.url).pathname;

export const command = 'create';
export const description = 'Scaffold a new app with a basic app-definition and styling.';

interface AppArgs {
  path?: string;
  name?: string;
  organization?: string;
  template?: string;
  languages?: string[];
  description?: string;
  resource?: string;
  security?: boolean;
  cronJobs?: boolean;
  groups?: boolean;
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
    })
    .option('resource', {
      describe: 'Name of a demo resource to be added to the app definition.',
    })
    .option('security', {
      describe: 'Whether to append a default security definition to app',
      type: 'boolean',
    })
    .option('cron-jobs', {
      describe: 'Whether to append default cron-jobs to the app definition',
    });
}

function validateAppName(value: string): boolean | string {
  if (value.length > 30 || value.length === 0) {
    return 'Please input a valid app name. Name must be between 1 and 30 characters long.';
  }
  return true;
}

export async function handler(args: AppArgs): Promise<void> {
  const templateChoices = await readdir(templatesDir);
  const languageChoices = ['en', 'nl', 'ru', 'fr', 'de', 'da', 'id', 'hr'];

  const organization =
    args.organization ||
    (await input({
      message: 'For which organisation is this app? (default "appsemble")',
    })) ||
    'appsemble';

  const name =
    args.name ||
    (await input({
      message: 'What will be the name of the app.',
      validate: validateAppName,
    }));

  const appDescription =
    args.description ||
    (await input({
      message: 'Please describe your app.',
    })) ||
    '';

  const template =
    args.template ||
    (await select({
      message: 'Please choose a template to continue.',
      choices: templateChoices.map((t) => ({ name: t, value: t })),
    }));

  const languages =
    args.languages ||
    (await checkbox({
      message: 'Please select the languages for your app.',
      choices: languageChoices.map((language) => ({ name: language, value: language })),
    }));

  const resource =
    args.resource ||
    (await input({
      message:
        'Please enter the name of sample resource to be added to the app definition.(leave empty for none)',
    }));

  const security =
    args.security ??
    (await confirm({
      message: 'Would you like to add a security definition to the app.',
      default: false,
    }));

  let groups = false;
  if (security) {
    groups = await confirm({
      message: 'Will you be using groups in your app.',
      default: false,
    });
  }

  const cronJobs =
    args.cronJobs ??
    (await confirm({
      message: 'Would you like to add a cron-job to the definition of the app.',
      default: false,
    }));

  const path =
    args.path ||
    (await input({
      message: 'Please enter the path for where you want the app folder to go (default "apps").',
    })) ||
    join(process.cwd(), 'apps');

  const outputDirectory = join(path, name);
  const inputDirectory = join(`${templatesDir}/`, template);
  const appsembleRcPath = join(inputDirectory, '.appsemblerc.yaml');
  const [appsembleRc] = await readData<AppsembleRC>(appsembleRcPath);
  const outputAppsembleRcObject: AppsembleRC = { ...appsembleRc };
  outputAppsembleRcObject.context ??= {};
  for (const key of Object.keys(appsembleRc.context ?? {})) {
    outputAppsembleRcObject.context[key].organization = organization;
  }
  const outputAppsembleRc = parse(stringify(outputAppsembleRcObject));
  const appDefinitionPath = join(inputDirectory, 'app-definition.yaml');
  const yaml = await readFile(appDefinitionPath, 'utf8');
  const appDefinition = parseDocument(yaml);

  appDefinition.set('name', name);
  appDefinition.set('description', appDescription);

  if (resource) {
    appDefinition.set('resources', {
      [resource]: {
        roles: ['$public'],
        schema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
    });
  }
  if (security) {
    appDefinition.set('security', {
      default: {
        role: 'User',
        policy: 'everyone',
      },
      roles: {
        User: {
          description: 'A sample user to be included in the app definition',
        },
      },
      groups: groups
        ? {
            join: 'invite',
            invite: ['$group:member'],
          }
        : undefined,
    });
    appDefinition.set('roles', ['User']);
  }
  if (cronJobs) {
    appDefinition.set('cron', {
      dailyLogs: {
        action: {
          type: 'noop',
        },
        schedule: '0 12 * * *',
      },
    });
  }

  const outputAppDefinition = await format(String(appDefinition), {
    tabWidth: 2,
    useTabs: false,
    endOfLine: 'lf',
    singleQuote: true,
    proseWrap: 'preserve',
    printWidth: 100,
    parser: 'yaml',
  });

  await cp(inputDirectory, outputDirectory, {
    errorOnExist: true,
    filter: (src) => !src.endsWith('.appsemblerc.yaml') || !src.endsWith('app-definition.yaml'),
    force: false,
    recursive: true,
  });
  for (const language of languages ?? []) {
    await writeData(join(outputDirectory, 'i18n', `${language}.json`), {});
  }
  await writeData(join(outputDirectory, '.appsemblerc.yaml'), outputAppsembleRc);
  await writeFile(join(outputDirectory, 'app-definition.yaml'), outputAppDefinition);
  logger.info(`Successfully created ${name} at ${outputDirectory}`);
}
