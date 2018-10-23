#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import compress from 'koa-compress';
import logger from 'koa-logger';
import OAIRouter from 'koa-oai-router';
import OAIRouterMiddleware from 'koa-oai-router-middleware';
import OAIRouterParameters from 'koa-oai-router-parameters';
import yaml from 'js-yaml';
import yargs from 'yargs';

import boomMiddleware from './middleware/boom';
import sequelizeMiddleware from './middleware/sequelize';
import routes from './routes';
import configureStatic from './utils/configureStatic';
import setupModels from './utils/setupModels';

export function processArgv() {
  const production = process.env.NODE_ENV === 'production';
  const parser = yargs
    .usage(
      `Usage:\n  ${
        production
          ? 'docker run -ti registry.gitlab.com/dcentralized/appsemble/appsemble'
          : 'yarn start'
      }`,
    )
    .help('help', 'Show this help message.')
    .alias('h', 'help')
    .env()
    .wrap(Math.min(180, yargs.terminalWidth()))
    .option('database-host', {
      desc:
        'The host of the database to connect to. This defaults to the connected database container.',
    })
    .option('database-port', {
      desc: 'The port of the database to connect to.',
      type: 'number',
      default: 3306,
    })
    .option('database-dialect', {
      desc: 'The dialect of the database.',
      default: 'mysql',
      choices: ['mysql', 'postgres'],
    })
    .option('database-name', {
      desc: 'The name of the database to connect to.',
      default: production ? undefined : 'appsemble',
      implies: ['database-user', 'database-password'],
    })
    .option('database-user', {
      desc: 'The user to use to login to the database.',
      default: production ? undefined : 'root',
      implies: ['database-name', 'database-password'],
    })
    .option('database-password', {
      desc: 'The password to use to login to the database.',
      default: production ? undefined : 'password',
      implies: ['database-name', 'database-user'],
    })
    .option('database-url', {
      desc:
        'A connection string for the database to connect to. This is an alternative to the separate database related variables.',
      conflicts: [
        'database-host',
        production && 'database-name',
        production && 'database-user',
        production && 'database-password',
      ].filter(Boolean),
    })
    .option('initialize-database', {
      desc: 'Initialize the database, then exit. This wipes any existing data.',
      type: 'boolean',
    })
    .alias('i', 'init-database')
    .option('port', {
      desc: 'The HTTP server port to use. (Development only)',
      type: 'number',
      default: 9999,
      hidden: production,
    });
  return parser.argv;
}

export default async function server({ app = new Koa(), db }) {
  const oaiRouter = new OAIRouter({
    apiDoc: path.join(__dirname, 'api'),
    options: {
      middleware: path.join(__dirname, 'controllers'),
      parameters: {},
    },
  });

  const oaiRouterStatus = new Promise((resolve, reject) => {
    oaiRouter.on('ready', resolve);
    oaiRouter.on('error', reject);
  });

  await oaiRouter.mount(OAIRouterParameters);
  await oaiRouter.mount(OAIRouterMiddleware);

  app.use(boomMiddleware);
  app.use(sequelizeMiddleware(db));
  app.use(bodyParser());
  if (process.env.NODE_ENV === 'production') {
    app.use(compress());
  }
  app.use(oaiRouter.routes());

  app.use(routes);
  await oaiRouterStatus;

  return app.callback();
}

async function main() {
  const args = processArgv();
  if (args.initDatabase) {
    const { sequelize } = await setupModels({
      sync: true,
      force: true,
      logging: true,
      host: args.databaseHost,
      dialect: args.databaseDialect,
      port: args.databasePort,
      username: args.databaseUser,
      password: args.databasePassword,
      database: args.databaseName,
      uri: args.databaseUrl,
    });
    await sequelize.close();
    return;
  }
  const db = await setupModels({
    host: args.databaseHost,
    dialect: args.databaseDialect,
    port: args.databasePort,
    username: args.databaseUser,
    password: args.databasePassword,
    database: args.databaseName,
    uri: args.databaseUrl,
  });
  const app = new Koa();
  app.use(logger());
  await configureStatic(app);

  await server({ app, db });
  const { description } = yaml.safeLoad(
    fs.readFileSync(path.join(__dirname, 'api', 'api.yaml')),
  ).info;

  app.listen(args.port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(description);
  });
}

if (module === require.main) {
  main().catch(err => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}
