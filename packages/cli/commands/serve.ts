import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import { basename, extname, join, parse } from 'node:path';
import { Readable } from 'node:stream';

import {
  AppsembleError,
  createServer,
  logger,
  opendirSafe,
  readData,
  writeData,
} from '@appsemble/node-utils';
import {
  type App,
  type AppDefinition,
  type AppMessages,
  type AppsembleMessages,
  type Asset,
} from '@appsemble/types';
import { api, asciiLogo, getAppBlocks, normalize, parseBlockName } from '@appsemble/utils';
import * as csvToJson from 'csvtojson';
import FormData from 'form-data';
import { type Argv } from 'yargs';

import { traverseAppDirectory } from '../lib/app.js';
import { buildBlock, getBlockConfig, makePayload } from '../lib/block.js';
import { loadWebpackConfig } from '../lib/loadWebpackConfig.js';
import pkg from '../package.json' assert { type: 'json' };
import * as controllers from '../server/controllers/index.js';
import { setAppDir } from '../server/db/app.js';
import { Resource } from '../server/models/Resource.js';
import { appRouter } from '../server/routes/appRouter/index.js';
import { type BaseArguments } from '../types.js';

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
    })
    .option('user-role', {
      desc: 'The role to authenticate the user with.',
      type: 'string',
      default: 9999,
    });
}

export async function handler(argv: ServeArguments): Promise<void> {
  const appPath = join(process.cwd(), argv.path);
  const [, , , appsembleApp] = await traverseAppDirectory(appPath, 'development', new FormData());
  const appName = normalize(appsembleApp.definition.name);
  const appId = 1;
  setAppDir(appName);

  const identifiableBlocks = getAppBlocks(appsembleApp.definition);

  const remotesFetchResult = spawnSync('git', ['fetch', '--all'], { encoding: 'utf8' });

  if (remotesFetchResult.status !== 0) {
    const fetchErrors = remotesFetchResult.stderr.trim().split('\n');
    logger.error('There was an error fetching remote repositories');
    for (const error of fetchErrors) {
      logger.error(error);
    }
  }

  const blockConfigs = await Promise.all(
    identifiableBlocks.map(async (identifiableBlock) => {
      const [organization, blockName] = parseBlockName(identifiableBlock.type);

      if (organization !== 'appsemble') {
        logger.info(`Checking out ${blockName} from ${organization}/master`);
        const masterCheckoutResult = spawnSync(
          'git',
          ['checkout', `${organization}/master`, '--', `blocks/${blockName}`],
          { encoding: 'utf8' },
        );

        if (masterCheckoutResult.status !== 0) {
          const masterErrors = masterCheckoutResult.stderr.trim().split('\n');
          logger.error(`There was an error checking out ${blockName} from ${organization}/master`);
          for (const error of masterErrors) {
            logger.error(error);
          }

          logger.info(`Checking out ${blockName} from ${organization}/main`);
          const mainCheckoutResult = spawnSync(
            'git',
            ['checkout', `${organization}/main`, '--', `blocks/${blockName}`],
            { encoding: 'utf8' },
          );

          if (mainCheckoutResult.status !== 0) {
            const mainErrors = mainCheckoutResult.stderr.trim().split('\n');
            logger.error(`There was an error checking out ${blockName} from ${organization}/main`);
            for (const error of mainErrors) {
              logger.error(error);
            }
          }
        }

        const [blockTsConfig] = (await readData(`blocks/${blockName}/tsconfig.json`)) as any;

        await writeData(`blocks/${blockName}/tsconfig.json`, {
          ...blockTsConfig,
          compilerOptions: {
            ...blockTsConfig.compilerOptions,
            lib: ['dom', 'dom.iterable', 'esnext'],
            types: ['@appsemble/webpack-config/types', 'jest'],
          },
        });
      }

      const blockConfig = await getBlockConfig(join(process.cwd(), 'blocks', blockName));
      return {
        ...blockConfig,
        OrganizationId: organization,
      };
    }),
  );

  const blockPromises = blockConfigs.map(async (blockConfig) => {
    await buildBlock(blockConfig);
    const [, blockData] = await makePayload(blockConfig);
    blockData.version = identifiableBlocks.find(
      (identifiableBlock) => identifiableBlock.type === blockData.name,
    ).version;
    return blockData;
  });

  const appBlocks = await Promise.all(blockPromises);

  const webpackConfigs = await Promise.all(
    blockConfigs.map((blockConfig) =>
      loadWebpackConfig(blockConfig, 'development', join(blockConfig.dir, blockConfig.output)),
    ),
  );

  // Get app messages
  const appMessages: AppMessages[] = [];
  await opendirSafe(
    join(appPath, 'i18n'),
    async (path) => {
      logger.verbose(`Processing ${path} ⚙️`);
      const { name: language } = parse(path);

      if (appMessages.some((entry) => entry.language === language)) {
        throw new AppsembleError(
          `Found duplicate language “${language}”. Make sure each language only exists once in the directory.`,
        );
      }

      const [messages] = await readData<AppsembleMessages>(path);
      appMessages.push({ language, messages });
    },
    { allowMissing: true },
  );

  // Get app assets
  const appAssets: Asset[] = [];
  await opendirSafe(
    join(appPath, 'assets'),
    (path) => {
      logger.verbose(`Processing ${path} ⚙️`);

      const extension = extname(path);
      const name = basename(path, extension);

      appAssets.push({
        id: name,
        mime: extension,
        filename: path,
        name,
      });
    },
    { allowMissing: true },
  );

  // Get app resources
  await opendirSafe(
    join(appPath, 'resources'),
    async (path, stat) => {
      logger.verbose(`Processing ${path} ⚙️`);

      let resources: unknown[];
      if (path.endsWith('.csv')) {
        const data = await readFile(path);
        const stream = Readable.from(data);
        resources = await csvToJson({}).fromStream(stream);
      } else {
        const [resource] = await readData(path);
        if (typeof resource !== 'object') {
          throw new AppsembleError(
            `File at ${path} does not contain an object or array of objects`,
          );
        }
        resources = [].concat(resource);
      }

      logger.info(`Creating resource(s) from ${path}`);

      const { name } = parse(stat.name);

      await Resource.bulkCreate(resources as Record<string, any>[], name, true);
    },
    { allowMissing: true },
  );

  const publicResources = appsembleApp.definition.resources;
  for (const entry of Object.entries(appsembleApp.definition.resources || {})) {
    const [key, resource] = entry;
    publicResources[key] = {
      ...resource,
      query: {
        ...resource.query,
        roles: ['$public'],
      },
      get: {
        ...resource.get,
        roles: ['$public'],
      },
      create: {
        ...resource.create,
        roles: ['$public'],
      },
      update: {
        ...resource.update,
        roles: ['$public'],
      },
      delete: {
        ...resource.delete,
        roles: ['$public'],
      },
      roles: ['$public'],
    };
  }

  const publicPages = appsembleApp.definition.pages.map((page) => {
    const publicBlocks =
      'blocks' in page ? page.blocks.map((block) => ({ ...block, roles: undefined })) : undefined;
    return {
      ...page,
      roles: ['$none'],
      blocks: publicBlocks,
    };
  });

  const publicAppDefinition: AppDefinition = {
    ...appsembleApp.definition,
    roles: ['$none'],
    security: undefined,
    resources: publicResources,
    pages: publicPages,
  };

  const stubbedApp = {
    ...appsembleApp,
    id: appId,
    path: appPath,
    definition: publicAppDefinition,
    coreStyle: appsembleApp.coreStyle || '',
    sharedStyle: appsembleApp.sharedStyle || '',
    $updated: new Date().toISOString(),
  } as App;

  const server = createServer({
    argv,
    appRouter,
    controllers,
    context: {
      appHost: `http://${appName}.localhost:9090`,
      appsembleApp: stubbedApp,
      appBlocks,
      appMessages,
      appAssets,
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
