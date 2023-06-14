import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import { basename, extname, join, parse } from 'node:path';
import { Readable } from 'node:stream';

import {
  AppsembleError,
  createServer,
  type ExtendedTeam,
  logger,
  opendirSafe,
  readData,
  writeData,
} from '@appsemble/node-utils';
import {
  type App,
  type AppMember,
  type AppMessages,
  type AppsembleMessages,
  type Asset,
  type UserInfo,
} from '@appsemble/types';
import { asciiLogo, getAppBlocks, normalize, parseBlockName } from '@appsemble/utils';
import csvToJson from 'csvtojson';
import FormData from 'form-data';
import { type Argv } from 'yargs';

import { traverseAppDirectory } from '../lib/app.js';
import { buildBlock, getBlockConfig, makePayload } from '../lib/block.js';
import { loadWebpackConfig } from '../lib/loadWebpackConfig.js';
import * as controllers from '../server/controllers/index.js';
import { setAppDir } from '../server/db/app.js';
import { Resource } from '../server/models/Resource.js';
import { appRouter } from '../server/routes/appRouter/index.js';
import { type BaseArguments } from '../types.js';

interface ServeArguments extends BaseArguments {
  path: string;
  port: number;
  'user-role': string;
  'team-role': string;
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
      desc: 'The role to set to the mocked authenticated user.',
      type: 'string',
    })
    .option('team-role', {
      desc: 'The role to set to the mocked authenticated user in the team.',
      type: 'string',
      default: 'member',
    });
}

export async function handler(argv: ServeArguments): Promise<void> {
  const appPath = join(process.cwd(), argv.path);
  const [, , , appsembleApp] = await traverseAppDirectory(appPath, 'development', new FormData());

  const passedUserRole = argv['user-role'];
  if (passedUserRole && !appsembleApp.definition.roles.includes(passedUserRole)) {
    throw new AppsembleError(
      `The specified role ${passedUserRole} is not supported by this app. Allowed roles are [${appsembleApp.definition.roles}]`,
    );
  }

  const appMembers: AppMember[] = [
    {
      id: '1',
      name: 'test',
      primaryEmail: 'test@gmail.com',
      role: passedUserRole,
    },
  ];

  const allowedTeamRoles = ['manager', 'member'] as const;
  const passedTeamRole = argv['team-role'] as (typeof allowedTeamRoles)[number];
  if (passedTeamRole && !allowedTeamRoles.includes(passedTeamRole)) {
    throw new AppsembleError(
      `The specified team role ${passedTeamRole} is not supported. Allowed roles are [member,manager]`,
    );
  }

  const appTeams: ExtendedTeam[] = [
    {
      id: 1,
      name: 'team',
      size: 1,
      role: passedTeamRole,
      annotations: {},
    },
  ];

  const appUserInfo: UserInfo = {
    email: 'test@gmail.com',
    email_verified: true,
    name: 'test',
    sub: '1',
  };

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

  const stubbedApp = {
    ...appsembleApp,
    id: appId,
    path: appPath,
    coreStyle: appsembleApp.coreStyle || '',
    sharedStyle: appsembleApp.sharedStyle || '',
    $updated: new Date().toISOString(),
  } as App;

  const server = await createServer({
    argv,
    appRouter,
    controllers,
    context: {
      appHost: `http://${appName}.localhost:${argv.port}`,
      appsembleApp: stubbedApp,
      appBlocks,
      appMessages,
      appMembers,
      appUserInfo,
      appTeams,
      appAssets,
      blockConfigs,
    },
    webpackConfigs,
  });

  server.on('error', (err) => {
    if (err.expose) {
      return;
    }
    logger.error(err);
  });

  const callback = server.callback();
  const httpServer = http.createServer(callback);

  httpServer.listen(argv.port, '::', () => {
    logger.info(asciiLogo);
    logger.info(
      `The app can be found on\n> http://${normalize(appsembleApp.definition.name)}.localhost:${
        argv.port
      }`,
    );
  });
}
