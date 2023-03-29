import http from 'node:http';
import { join, parse } from 'node:path';

import { AppsembleError, logger, opendirSafe, readData } from '@appsemble/node-utils';
import { createServer } from '@appsemble/node-utils/createServer.js';
import { AppMessages, AppsembleMessages } from '@appsemble/types';
import { api, asciiLogo, getAppBlocks, normalize, parseBlockName } from '@appsemble/utils';
import FormData from 'form-data';
import { Argv } from 'yargs';

import { traverseAppDirectory } from '../lib/app.js';
import { getBlockConfig, makePayload } from '../lib/block.js';
import { loadWebpackConfig } from '../lib/loadWebpackConfig.js';
import pkg from '../package.json' assert { type: 'json' };
import * as controllers from '../server/controllers/index.js';
import { appRouter } from '../server/routes/appRouter/index.js';
import { BaseArguments } from '../types.js';

interface ServeArguments extends BaseArguments {
  path: string;
  port: number;
  host: string;
}

export const command = 'serve path';
export const description = 'Serve an app with a local development server.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .positional('path', {
      describe: 'The path to the app to publish.',
    })
    .option('port', {
      desc: 'The HTTP server port to use.',
      type: 'number',
      default: 9999,
    });
}

export async function handler(argv: ServeArguments): Promise<void> {
  const appPath = join(process.cwd(), argv.path);
  const [, , , appsembleApp] = await traverseAppDirectory(appPath, 'development', new FormData());

  const identifiableBlocks = getAppBlocks(appsembleApp.definition);

  const blockConfigs = await Promise.all(
    identifiableBlocks.map(async (identifiableBlock) => {
      const [organization, blockName] = parseBlockName(identifiableBlock.type);
      const blockConfig = await getBlockConfig(join(process.cwd(), 'blocks', blockName));
      return {
        ...blockConfig,
        OrganizationId: organization,
      };
    }),
  );

  const blockPromises = blockConfigs.map(async (blockConfig) => {
    const [, blockData] = await makePayload(blockConfig);
    return blockData;
  });

  const appBlocks = await Promise.all(blockPromises);

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

  const server = createServer({
    argv,
    appRouter,
    controllers,
    context: {
      appHost: `http://${normalize(appsembleApp.definition.name)}.localhost:9090`,
      appsembleApp: {
        ...appsembleApp,
        id: 1,
        path: appPath,
        coreStyle: appsembleApp.coreStyle || '',
        sharedStyle: appsembleApp.sharedStyle || '',
        $updated: new Date().toISOString(),
      },
      appBlocks,
      appMessages,
      blockConfigs,
    },
    webpackConfigs: webpackConfigs as any,
  });

  server.on('error', (err) => {
    if (err.expose) {
      return;
    }
    logger.error(err);
  });

  const callback = server.callback();
  const httpServer = http.createServer(callback);

  httpServer.listen(9090, '::', () => {
    logger.info(asciiLogo);
    logger.info(
      `The app can be found on\n> http://${normalize(appsembleApp.definition.name)}.localhost:9090`,
    );
    logger.info(api(pkg.version, { port: 9090 }).info.description);
  });
}
