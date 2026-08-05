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

  it('should expose the body font as both font custom properties by default', async () => {
    const response = await request.get(bulmaUrl);
    expect(response.status).toBe(200);
    expect(response.data).toContain("--font-family: 'Open Sans', sans-serif");
    expect(response.data).toContain("--font-family-display: 'Open Sans', sans-serif");
  });

  it('should import and expose a google display font', async () => {
    const response = await request.get(
      `/bulma/${bulmaVersion}/bulma.min.css?displayFontFamily=Baloo+2&displayFontSource=google`,
    );
    expect(response.status).toBe(200);
    expect(response.data).toContain(
      '@import"https://fonts.googleapis.com/css?display=swap&family=Baloo+2"',
    );
    expect(response.data).toContain("--font-family: 'Open Sans', sans-serif");
    expect(response.data).toContain("--font-family-display: 'Baloo 2', sans-serif");

    const theme = await vi.waitFor(async () => {
      const persisted = await Theme.findOne();
      expect(persisted).not.toBeNull();
      return persisted;
    });
    expect(theme!.displayFontFamily).toBe('Baloo 2');
    expect(theme!.displayFontSource).toBe('google');
  });

  it('should persist themes with different display fonts separately', async () => {
    await request.get(`${bulmaUrl}&displayFontFamily=Baloo+2&displayFontSource=google`);
    await vi.waitFor(async () => expect(await Theme.count()).toBe(1));
    await request.get(`${bulmaUrl}&displayFontFamily=Lato&displayFontSource=google`);
    await vi.waitFor(async () => expect(await Theme.count()).toBe(2));
  });

  it('should not import a custom display font from google fonts', async () => {
    const response = await request.get(
      `/bulma/${bulmaVersion}/bulma.min.css?displayFontFamily=Comic+Sans&displayFontSource=custom`,
    );
    expect(response.status).toBe(200);
    expect(response.data).not.toContain('family=Comic+Sans');
    expect(response.data).toContain("--font-family-display: 'Comic Sans', sans-serif");
  });
});
