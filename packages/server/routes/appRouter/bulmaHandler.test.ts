import { bulmaVersion } from '@appsemble/node-utils';
import { createThemeURL, mergeThemes } from '@appsemble/utils';
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

  it('should append custom properties for the variables parameter', async () => {
    const variables = encodeURIComponent(
      '{"night":"#0E1220","font-display":"\'Baloo 2\', cursive"}',
    );
    const response = await request.get(
      `/bulma/${bulmaVersion}/bulma.min.css?variables=${variables}`,
    );
    expect(response.status).toBe(200);
    expect(response.data).toContain(":root{--font-display:'Baloo 2', cursive;--night:#0E1220}");

    const theme = await vi.waitFor(async () => {
      const persisted = await Theme.findOne();
      expect(persisted).not.toBeNull();
      return persisted;
    });
    expect(theme!.variables).toBe('{"font-display":"\'Baloo 2\', cursive","night":"#0E1220"}');
    expect(theme!.css).toBe(response.data);
  });

  it('should persist themes with different variables separately', async () => {
    await request.get(
      `/bulma/${bulmaVersion}/bulma.min.css?variables=%7B%22night%22%3A%22%230E1220%22%7D`,
    );
    await vi.waitFor(async () => expect(await Theme.count()).toBe(1));
    await request.get(
      `/bulma/${bulmaVersion}/bulma.min.css?variables=%7B%22night%22%3A%22%23141A2E%22%7D`,
    );
    await vi.waitFor(async () => expect(await Theme.count()).toBe(2));
  });

  it('should serve merged app, page and block themes with 32 variables each', async () => {
    const themes = ['app', 'page', 'block'].map((scope) => ({
      variables: Object.fromEntries(
        Array.from({ length: 32 }, (value, index) => [`${scope}-${index}`, '#123456']),
      ),
    }));

    const response = await request.get(createThemeURL(mergeThemes(...themes)));

    expect(response.status).toBe(200);
  });

  it('should reject malformed variables JSON', async () => {
    const response = await request.get(`/bulma/${bulmaVersion}/bulma.min.css?variables=not-json`);
    expect(response.status).toBe(400);
  });

  it('should reject invalid variable names', async () => {
    const variables = encodeURIComponent('{"bad name":"#123456"}');
    const response = await request.get(
      `/bulma/${bulmaVersion}/bulma.min.css?variables=${variables}`,
    );
    expect(response.status).toBe(400);
  });

  it('should reject variable values that could escape the declaration block', async () => {
    const variables = encodeURIComponent('{"night":"red;}body{background:url(evil)"}');
    const response = await request.get(
      `/bulma/${bulmaVersion}/bulma.min.css?variables=${variables}`,
    );
    expect(response.status).toBe(400);
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

  it('should persist a display font without a source as a google font', async () => {
    const response = await request.get(`${bulmaUrl}&displayFontFamily=Baloo+2`);
    expect(response.status).toBe(200);
    expect(response.data).toContain(
      '@import"https://fonts.googleapis.com/css?display=swap&family=Baloo+2"',
    );

    const theme = await vi.waitFor(async () => {
      const persisted = await Theme.findOne();
      expect(persisted).not.toBeNull();
      return persisted;
    });
    expect(theme!.displayFontSource).toBe('google');
  });

  it('should persist themes with different display fonts separately', async () => {
    await request.get(`${bulmaUrl}&displayFontFamily=Baloo+2&displayFontSource=google`);
    await vi.waitFor(async () => expect(await Theme.count()).toBe(1));
    await request.get(`${bulmaUrl}&displayFontFamily=Lato&displayFontSource=google`);
    await vi.waitFor(async () => expect(await Theme.count()).toBe(2));
  });

  it('should import a google font once when the display font equals the body font', async () => {
    const response = await request.get(
      `/bulma/${bulmaVersion}/bulma.min.css?fontFamily=Lato&fontSource=google&displayFontFamily=Lato&displayFontSource=google`,
    );
    expect(response.status).toBe(200);
    expect(response.data.match(/@import"https:\/\/fonts\.googleapis\.com[^"]*"/g)).toStrictEqual([
      '@import"https://fonts.googleapis.com/css?display=swap&family=Lato"',
    ]);
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
