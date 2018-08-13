#!/usr/bin/env node
import path from 'path';

import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import logger from 'koa-logger';
import OAIRouter from 'koa-oai-router';
import OAIRouterMiddleware from 'koa-oai-router-middleware';
import OAIRouterParameters from 'koa-oai-router-parameters';

import routes from './routes';
import configureStatic from './utils/configureStatic';


const dirname = path.dirname(new URL(import.meta.url).pathname);


const PORT = 9999;


async function main() {
  const oaiRouter = new OAIRouter({
    apiDoc: path.join(dirname, 'api'),
    options: {
      middleware: path.join(dirname, 'controllers'),
      parameters: {},
    },
  });
  oaiRouter.mount(OAIRouterParameters);
  oaiRouter.mount(OAIRouterMiddleware);


  const server = new Koa();
  server.use(logger());
  server.use(bodyParser());
  server.use(oaiRouter.routes());
  await configureStatic(server);
  server.use(routes);


  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`View the API explorer at http://localhost:${PORT}/api-explorer`);
  });
}


main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
