import { logger, version } from '@appsemble/node-utils';
import { type AxiosTestInstance, setTestApp } from 'axios-test-instance';
import Koa from 'koa';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { validateServerVersion } from './validateServerVersion.js';

let client: AxiosTestInstance;
let serverVersion: string;
let supportsHead: boolean;

describe('validateServerVersion', () => {
  beforeEach(async () => {
    const app = new Koa();
    app.use((ctx) => {
      if (ctx.path !== '/api') {
        ctx.status = 404;
        return;
      }

      if (ctx.method === 'HEAD' && !supportsHead) {
        ctx.status = 405;
        return;
      }

      ctx.set('X-Appsemble-Version', serverVersion);
      ctx.status = 204;
    });
    client = await setTestApp(app);
    client.defaults.validateStatus = (status) => status >= 200 && status < 300;
    supportsHead = true;
    vi.spyOn(logger, 'warn').mockImplementation(() => logger);
  });

  it('should not warn if the server and CLI versions match', async () => {
    serverVersion = version;

    await validateServerVersion({
      get: (url, options) => client.get(url, options),
      head: (url, options) => client.head(url, options),
    });

    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should fall back to GET and warn once if an older server does not support HEAD', async () => {
    serverVersion = '1.2.3';
    supportsHead = false;

    const versionClient = {
      get: (url: string, options: { timeout: number }) => client.get(url, options),
      head: (url: string, options: { timeout: number }) => client.head(url, options),
    };
    await validateServerVersion(versionClient);
    await validateServerVersion(versionClient);

    expect(logger.warn).toHaveBeenCalledExactlyOnceWith(
      `The Appsemble server version (1.2.3) does not match the CLI version (${version}).`,
    );
  });
});
