import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import http from 'node:http';
import { basename, extname, join, parse } from 'node:path';
import { Readable } from 'node:stream';

import {
  AppsembleError,
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
  type BlockManifest,
  type UserInfo,
} from '@appsemble/types';
import {
  asciiLogo,
  getAppBlocks,
  type IdentifiableBlock,
  normalize,
  parseBlockName,
} from '@appsemble/utils';
import axios from 'axios';
import csvToJson from 'csvtojson';
import FormData from 'form-data';
import globalCacheDir from 'global-cache-dir';
import { type Argv } from 'yargs';

import { traverseAppDirectory } from '../lib/app.js';
import { buildBlock } from '../lib/block.js';
import { getProjectBuildConfig, getProjectWebpackConfig } from '../lib/config.js';
import { createApiServer, createStaticServer } from '../lib/createServers.js';
import { makeProjectPayload } from '../lib/project.js';
import { setArgv } from '../server/argv.js';
import { setAppName } from '../server/db/methods.js';
import { Resource } from '../server/models/Resource.js';

export interface ServeArguments {
  remote: string;
  path: string;
  port: number;
  'api-port': number;
  'user-role': string;
  'team-role': string;
  'overwrite-block-cache': boolean;
}

export const command = 'serve path';
export const description = 'Serve an app with a local development server.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .positional('path', {
      describe: 'The path to the app to publish.',
    })
    .option('port', {
      desc: 'The static HTTP server port to use. This is the port where the app is accessible.',
      type: 'number',
      default: 9090,
    })
    .option('api-port', {
      desc: 'The Appsemble development HTTP server port to use. This is the port where the Appsemble development API endpoints are available.',
      type: 'number',
      default: 9191,
    })
    .option('user-role', {
      desc: 'The role to set to the mocked authenticated user.',
      type: 'string',
    })
    .option('team-role', {
      desc: 'The role to set to the mocked authenticated user in the team.',
      type: 'string',
      default: 'member',
    })
    .option('remote', {
      desc: 'The address to fetch remote blocks from.',
      type: 'string',
    })
    .option('overwrite-block-cache', {
      desc: 'Whether to overwrite remote blocks cache if it exists.',
      type: 'boolean',
      default: false,
    });
}

export async function handler(argv: ServeArguments): Promise<void> {
  setArgv(argv);
  const appPath = join(process.cwd(), argv.path);
  const [, , , appsembleApp] = await traverseAppDirectory(appPath, 'development', new FormData());

  const appRoles = appsembleApp.definition.roles;

  const passedUserRole = argv['user-role'];
  if (passedUserRole && !appRoles?.includes(passedUserRole)) {
    throw appRoles
      ? new AppsembleError(
          `The specified role "${passedUserRole}" is not supported by this app. Supported roles are [${appRoles}]`,
        )
      : new AppsembleError('This app does not support roles');
  }

  const appSecurity = appsembleApp.definition.security;

  const appMembers: AppMember[] = [
    {
      userId: '1',
      memberId: '1',
      name: 'dev',
      primaryEmail: 'dev@example.com',
      role: passedUserRole || appSecurity?.default.role,
      demo: false,
      properties: {},
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
    email: 'dev@example.com',
    email_verified: true,
    name: 'dev',
    sub: '1',
  };

  const appName = normalize(appsembleApp.definition.name);
  const appId = 1;
  setAppName(appName);

  const identifiableBlocks = getAppBlocks(appsembleApp.definition);

  const localIdentifiableBlocks: IdentifiableBlock[] = [];
  const remoteIdentifiableBlocks: IdentifiableBlock[] = [];

  for (const identifiableBlock of identifiableBlocks) {
    const [, blockName] = parseBlockName(identifiableBlock.type);
    if (existsSync(join(process.cwd(), 'blocks', blockName))) {
      localIdentifiableBlocks.push(identifiableBlock);
    } else {
      remoteIdentifiableBlocks.push(identifiableBlock);
    }
  }

  const localBlocksConfigs = await Promise.all(
    localIdentifiableBlocks.map(async (identifiableBlock) => {
      const [organization, blockName] = parseBlockName(identifiableBlock.type);

      const buildConfig = await getProjectBuildConfig(join(process.cwd(), 'blocks', blockName));
      return {
        ...buildConfig,
        OrganizationId: organization,
      };
    }),
  );

  const localBlocksPromises = localBlocksConfigs.map(async (blockConfig) => {
    await buildBlock(blockConfig);
    const [, blockImplementations] = await makeProjectPayload(blockConfig);

    return {
      ...blockImplementations,
      ...blockConfig,
    };
  });

  const cacheDir = await globalCacheDir('appsemble');
  const remoteBlocksPromises = remoteIdentifiableBlocks.map(async (identifiableBlock) => {
    const [organization, blockName] = parseBlockName(identifiableBlock.type);

    const blockCacheDir = join(
      cacheDir,
      'blocks',
      organization,
      blockName,
      identifiableBlock.version,
    );

    const cachedBlockManifest = join(blockCacheDir, 'manifest.json');

    const cacheExists = existsSync(cachedBlockManifest);
    if (!cacheExists || (cacheExists && argv['overwrite-block-cache'])) {
      const blockUrl = `/api/blocks/@${organization}/${blockName}/versions/${identifiableBlock.version}`;

      try {
        const { data: blockManifest }: { data: BlockManifest } = await axios.get(
          String(new URL(blockUrl, argv.remote)),
        );

        await writeData(cachedBlockManifest, blockManifest);

        const assetsDir = join(blockCacheDir, 'assets');
        if (!existsSync(assetsDir)) {
          await mkdir(assetsDir);
        }

        const blockFilesPromises = blockManifest.files.map(async (filename) => {
          const writer = createWriteStream(join(assetsDir, filename));

          const { data: content } = await axios.get(
            String(new URL(`${blockUrl}/asset?filename=${filename}`, argv.remote)),
            {
              responseType: 'stream',
            },
          );

          content.pipe(writer);
        });

        await Promise.all(blockFilesPromises);

        return blockManifest;
      } catch {
        throw new AppsembleError(
          `The server was unable to fetch the "${blockName}" block\nThis could be due to a misconfigured remote\nMake sure the passed remote supports fetching blocks such as https://appsemble.app`,
        );
      }
    }

    const [blockManifest] = await readData(cachedBlockManifest);
    return blockManifest;
  });

  const localBlocks = await Promise.all(localBlocksPromises);
  const remoteBlocks = await Promise.all(remoteBlocksPromises);

  const appBlocks = [...localBlocks, ...remoteBlocks];

  const webpackConfigs = await Promise.all(
    localBlocksConfigs.map((blockConfig) =>
      getProjectWebpackConfig(
        blockConfig,
        'development',
        join(blockConfig.dir, blockConfig.output),
      ),
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

  const appsembleApiServer = createApiServer({
    context: {
      appHost: `http://localhost:${argv.port}`,
      appsembleApp: stubbedApp,
      appBlocks,
      appMessages,
      ...(appSecurity
        ? {
            appMembers,
            appUserInfo,
            appTeams,
          }
        : {}),
      appAssets,
      blockConfigs: localBlocksConfigs,
    },
  });

  appsembleApiServer.on('error', (err) => {
    if (err.expose) {
      return;
    }
    logger.error(err);
  });

  const api = http.createServer(appsembleApiServer.callback());

  const staticServer = await createStaticServer({
    context: {
      appPath,
      apiUrl: `http://localhost:${argv['api-port']}`,
      appHost: `http://localhost:${argv.port}`,
      appsembleApp: stubbedApp,
      appBlocks,
      appMessages,
      ...(appSecurity
        ? {
            appMembers,
            appUserInfo,
            appTeams,
          }
        : {}),
      appAssets,
      blockConfigs: localBlocksConfigs,
    },
    webpackConfigs,
  });

  staticServer.on('error', (err) => {
    if (err.expose) {
      return;
    }
    logger.error(err);
  });

  const app = http.createServer(staticServer.callback());

  api.listen(argv['api-port'], '::', () => {
    logger.info(asciiLogo);
    logger.info(`The api can be found on\n> http://localhost:${argv['api-port']}`);
  });

  app.listen(argv.port, '::', () => {
    logger.info(`\nThe app can be found on\n> http://localhost:${argv.port}`);
  });
}
