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

import boomMiddleware from './middleware/boom';
import sequelizeMiddleware from './middleware/sequelize';
import routes from './routes';
import configureStatic from './utils/configureStatic';
import setupModels from './utils/setupModels';

const PORT = 9999;

export default function server({
  app = new Koa(),
  db = setupModels({
    sync: true,
    database: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/appsemble',
  }),
}) {
  const oaiRouter = new OAIRouter({
    apiDoc: path.join(__dirname, 'api'),
    options: {
      middleware: path.join(__dirname, 'controllers'),
      parameters: {},
    },
  });
  oaiRouter.mount(OAIRouterParameters);
  oaiRouter.mount(OAIRouterMiddleware);

  app.use(boomMiddleware);
  app.use(sequelizeMiddleware(db));

  app.use(async (ctx, next) => {
    if (ctx.path === 'api/assets') {
      // Allow the server to manage the body and Content-Type on its own
      ctx.disableBodyParser = ctx.path === '/api/assets' && ctx.method.toLowerCase() === 'post';

      // Necessary in order to be able to upload .json files to /api/assets.
      if (ctx.method.toLowerCase() === 'post') {
        ctx.request.body = {};
      }
    }

    await next();
  });
  app.use(bodyParser());
  if (process.env.NODE_ENV === 'production') {
    app.use(compress());
  }
  app.use(oaiRouter.routes());

  app.use(routes);

  return app.callback();
}

async function main() {
  const app = new Koa();
  app.use(logger());
  await configureStatic(app);

  server({
    app,
  });
  const { description } = yaml.safeLoad(
    fs.readFileSync(path.join(__dirname, 'api', 'api.yaml')),
  ).info;

  app.listen(PORT, '0.0.0.0', () => {
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
