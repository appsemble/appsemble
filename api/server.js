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
import routes from './routes';
import configureStatic from './utils/configureStatic';


const PORT = 9999;


async function main() {
  const oaiRouter = new OAIRouter({
    apiDoc: path.join(__dirname, 'api'),
    options: {
      middleware: path.join(__dirname, 'controllers'),
      parameters: {},
    },
  });
  oaiRouter.mount(OAIRouterParameters);
  oaiRouter.mount(OAIRouterMiddleware);


  const server = new Koa();
  server.use(logger());
  server.use(boomMiddleware);
  server.use(bodyParser());
  if (process.env.NODE_ENV === 'production') {
    server.use(compress());
  }
  server.use(oaiRouter.routes());
  await configureStatic(server);
  server.use(routes);


  const { description } = yaml.safeLoad(fs.readFileSync(path.join(__dirname, 'api', 'api.yaml'))).info;


  server.listen(PORT, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(description);
  });
}


if (module === require.main) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}
