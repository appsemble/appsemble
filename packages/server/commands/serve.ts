import http from 'node:http';

import { logger, loggerMiddleware } from '@appsemble/node-utils';
import { App, BlockConfig, Messages } from '@appsemble/types';
import { asciiLogo, IdentifiableBlock } from '@appsemble/utils';
import Koa, { Middleware } from 'koa';
import range from 'koa-range';
import { Configuration } from 'webpack';
import { Argv } from 'yargs';

import { boomMiddleware } from '../middleware/boom.js';
import { argv } from '../utils/argv.js';

interface AdditionalArguments {
  appsembleApp: App;
  apiUrl: string;
  appRouter: Middleware;
  appBlocks: IdentifiableBlock[];
  appMessages: Messages[];
  host: string;
  blockConfigs: BlockConfig[];
  webpackConfigs?: Configuration[];
}

export const PORT = 8080;
export const command = 'serve';
export const description = 'Start the Appsemble development server';

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

export async function handler({
  apiUrl,
  appBlocks,
  appMessages,
  appRouter,
  appsembleApp,
  blockConfigs,
  webpackConfigs,
}: AdditionalArguments): Promise<void> {
  const app = new Koa();

  const { default: webpackDevMiddleware } = await import('webpack-dev-middleware');
  const { default: webpack } = await import('webpack');
  // eslint-disable-next-line import/no-extraneous-dependencies
  const { default: expressToKoa } = await import('express-to-koa');

  const { createAppConfig } = await import('@appsemble/webpack-core');
  const appConfig = createAppConfig({ mode: 'development' });

  const configs = [appConfig, ...webpackConfigs];
  const compiler = webpack(configs);
  const middleware = webpackDevMiddleware(compiler);

  // @ts-expect-error asd
  const fs: import('memfs').IFs = middleware.context.outputFileSystem;
  const koaDevMiddleware = expressToKoa(middleware);

  app.use(loggerMiddleware());
  app.use(boomMiddleware());
  app.use(range);
  app.use((ctx, next) => {
    ctx.fs = fs;
    ctx.appsembleApp = appsembleApp;
    ctx.appBlocks = appBlocks;
    ctx.appMessages = appMessages;
    ctx.blockConfigs = blockConfigs;
    ctx.apiUrl = apiUrl;
    return next();
  });
  app.use(koaDevMiddleware);
  app.use(appRouter);

  app.on('error', (err) => {
    if (err.expose) {
      // It is thrown by `ctx.throw()` or `ctx.assert()`.
      return;
    }
    logger.error(err);
  });

  const callback = app.callback();
  const httpServer = http.createServer(callback);

  httpServer.listen(argv.port || PORT, '::', () => {
    logger.info(asciiLogo);
  });
}
