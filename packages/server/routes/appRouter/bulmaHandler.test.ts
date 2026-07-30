import { bulmaVersion } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { appRouter } from './index.js';
import { Theme } from '../../models/index.js';

const bulmaUrl = `/bulma/${bulmaVersion}/bulma.min.css?primaryColor=%23123456`;

describe('bulmaHandler', () => {
  beforeAll(async () => {
    const app = new Koa();
    app.use(appRouter);
    await setTestApp(app);
  });

  it('should serve compiled css for the requested theme and persist it', async () => {
    const response = await request.get(bulmaUrl);
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/css');
    expect(response.data).toContain('#123456');

    // The theme is persisted in the background, after the response is sent.
    const theme = await vi.waitFor(async () => {
      const persisted = await Theme.findOne();
      expect(persisted).not.toBeNull();
      return persisted;
    });
    expect(theme!.bulmaVersion).toBe(bulmaVersion);
    expect(theme!.primaryColor).toBe('#123456');
    expect(theme!.css).toBe(response.data);
  });

  it('should serve the persisted css instead of recompiling', async () => {
    await request.get(bulmaUrl);
    await vi.waitFor(async () => expect(await Theme.count()).toBe(1));
    await Theme.update({ css: '.cached{color:red}' }, { where: {} });

    const response = await request.get(bulmaUrl);
    expect(response.status).toBe(200);
    expect(response.data).toBe('.cached{color:red}');
    expect(await Theme.count()).toBe(1);
  });

  it('should compile and persist each theme separately', async () => {
    await request.get(bulmaUrl);
    await request.get(`/bulma/${bulmaVersion}/bulma.min.css?primaryColor=%23654321`);
    await vi.waitFor(async () => expect(await Theme.count()).toBe(2));
  });
});
