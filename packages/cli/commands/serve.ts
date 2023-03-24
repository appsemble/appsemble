import { join, parse } from 'node:path';

import { AppsembleError, logger, opendirSafe, readData } from '@appsemble/node-utils';
import { AppMessages, AppsembleMessages } from '@appsemble/types';
import { getAppBlocks, stripBlockName } from '@appsemble/utils';
import FormData from 'form-data';
import { Argv } from 'yargs';

import { traverseAppDirectory } from '../lib/app.js';
import { getBlockConfig } from '../lib/block.js';
import { loadWebpackConfig } from '../lib/loadWebpackConfig.js';
import { serverImport } from '../lib/serverImport.js';
import { appRouter } from '../routes/appRouter/index.js';
import { BaseArguments } from '../types.js';

interface ServeArguments extends BaseArguments {
  path: string;
  port: number;
}

export const command = 'serve path';
export const description = 'Serve an app with a local development server.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .positional('path', {
      describe: 'The path to the app to publish.',
    })
    .option('remote', {
      desc: 'The external host on which the server is available. This should include the protocol, hostname, and optionally the port.',
      default: 'https://appsemble.app',
    })
    .option('port', {
      desc: 'The HTTP server port to use.',
      type: 'number',
      default: 8080,
    });
}

export async function handler(argv: ServeArguments): Promise<void> {
  const { serve, setArgv } = await serverImport('setArgv', 'serve');
  const host = `http://localhost:${argv.port || 8080}`;
  setArgv({ ...argv, host });

  const appPath = join(process.cwd(), argv.path);
  const [, , , appsembleApp] = await traverseAppDirectory(appPath, 'development', new FormData());

  const appBlocks = getAppBlocks(appsembleApp.definition);
  const blockConfigs = await Promise.all(
    appBlocks
      .map((block) => stripBlockName(block.type))
      .map((path) => getBlockConfig(join(process.cwd(), 'blocks', path))),
  );

  const webpackConfigs = await Promise.all(
    blockConfigs.map((blockConfig) =>
      loadWebpackConfig(blockConfig, 'development', join(blockConfig.dir, blockConfig.output)),
    ),
  );

  const appMessages: AppMessages[] = [];
  await opendirSafe(
    join(appPath, 'i18n'),
    async (messageFile) => {
      logger.verbose(`Processing ${messageFile} ⚙️`);
      const { name: language } = parse(messageFile);

      if (appMessages.some((entry) => entry.language === language)) {
        throw new AppsembleError(
          `Found duplicate language “${language}”. Make sure each language only exists once in the directory.`,
        );
      }

      const [messages] = await readData<AppsembleMessages>(messageFile);
      appMessages.push({ language, messages });
    },
    { allowMissing: true },
  );

  return serve({
    webpackConfigs,
    appsembleApp: {
      ...appsembleApp,
      id: 1,
      coreStyle: appsembleApp.coreStyle || '',
      sharedStyle: appsembleApp.sharedStyle || '',
      $updated: new Date().toISOString(),
    },
    apiUrl: host,
    appBlocks,
    appMessages,
    blockConfigs,
    appRouter,
  });
}
