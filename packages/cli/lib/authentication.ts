import { type AddressInfo, type Server } from 'node:net';
import { hostname } from 'node:os';

import {
  AppsembleError,
  assertKoaCondition,
  getKeytar,
  getService,
  logger,
  throwKoaError,
} from '@appsemble/node-utils';
import inquirer from 'inquirer';
import Koa, { type Context } from 'koa';
import open from 'open';
import raw from 'raw-body';

import { type BaseArguments } from '../types.js';

function validate(credentials: string): boolean {
  return /.+:.+/.test(credentials);
}

function waitForCredentials(url: URL): Promise<string> {
  return new Promise((resolve) => {
    const app = new Koa();

    let server: Server;
    app.use(async (ctx: Context) => {
      ctx.set({
        'access-control-allow-headers': '*',
        'access-control-allow-methods': 'post',
        'access-control-allow-origin': url.origin,
      });
      if (ctx.method === 'OPTIONS') {
        ctx.status = 204;
        return;
      }
      ctx.assert(ctx.path === '/', 404);
      ctx.assert(ctx.method === 'POST', 405);
      ctx.assert(ctx.is('json'), 415);
      let credentials: string;
      try {
        ({ credentials } = JSON.parse(await raw(ctx.req, { encoding: 'utf8' })));
      } catch {
        throwKoaError(ctx, 400, 'Invalid JSON');
      }

      assertKoaCondition(
        !(typeof credentials === 'string' && !validate(credentials)),
        ctx,
        400,
        'Invalid client credentials',
      );
      ctx.status = 204;
      server.close();
      resolve(credentials);
    });
    server = app.listen();

    url.searchParams.set('callback', String((server.address() as AddressInfo).port));
    url.searchParams.set('description', hostname());
    open(String(url));
  });
}

export async function login({ clientCredentials, remote }: BaseArguments): Promise<void> {
  const { setPassword } = await getKeytar();
  const url = new URL('/settings/client-credentials', remote);
  let credentials = clientCredentials;
  if (credentials) {
    if (!validate(clientCredentials)) {
      throw new AppsembleError(
        `Invalid client credentials. Client credentials can be registered on ${url}`,
      );
    }
    credentials = clientCredentials;
  } else {
    logger.info(`Opening ${url}`);
    credentials = await waitForCredentials(url);
  }
  const [clientId, clientSecret] = credentials.split(':');
  await setPassword(getService(remote), clientId, clientSecret);
  logger.info(`Successfully stored credentials for ${clientId} 🕶`);
}

export async function remove({ remote }: BaseArguments): Promise<void> {
  const { deletePassword, findCredentials } = await getKeytar();
  const choices = await findCredentials(getService(remote));
  if (choices.length === 0) {
    logger.warn('No client credentials are currently in use.');
    return;
  }
  const { clientIds } = await inquirer.prompt<{ clientIds: string[] }>([
    {
      name: 'clientIds',
      message: 'Select client ids to delete',
      choices: choices.map(({ account }) => account),
      type: 'checkbox',
    },
  ]);
  await Promise.all(
    clientIds.map(async (clientId) => {
      await deletePassword(getService(remote), clientId);
      logger.info(`Successfully delete client id ${clientId}`);
    }),
  );
}
