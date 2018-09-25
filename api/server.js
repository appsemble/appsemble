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


const PORT = 9999;


export default async function server() {
  const oaiRouter = new OAIRouter({
    apiDoc: path.join(__dirname, 'api'),
    options: {
      middleware: path.join(__dirname, 'controllers'),
      parameters: {},
    },
  });
  oaiRouter.mount(OAIRouterParameters);
  oaiRouter.mount(OAIRouterMiddleware);


  const app = new Koa();
  app.use(logger());
  app.use(boomMiddleware);
  app.use(sequelizeMiddleware);
  app.use(bodyParser());
  if (process.env.NODE_ENV === 'production') {
    app.use(compress());
  }
  app.use(oaiRouter.routes());

  if (process.env.NODE_ENV !== 'test') {
    await configureStatic(app);
  }

  app.use(routes);

  return app;
}


if (module === require.main) {
  server().then((app) => {
    const { description } = yaml.safeLoad(fs.readFileSync(path.join(__dirname, 'api', 'api.yaml'))).info;

    app.listen(PORT, '0.0.0.0', () => {
      // eslint-disable-next-line no-console
      console.log(description);
    });
  }).catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}
