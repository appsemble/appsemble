import { baseTheme } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import bulma from 'bulma/package.json' assert { type: 'json' };
import Koa from 'koa';
import { omit } from 'lodash-es';
import sass from 'sass';

import { boomMiddleware } from '../../middleware/boom.js';
import { Theme } from '../../models/index.js';
import { setArgv } from '../../utils/argv.js';
import { useTestDatabase } from '../../utils/test/testSchema.js';
import { appRouter } from './index.js';

useTestDatabase(import.meta);

beforeAll(async () => {
  setArgv({ host: 'http://localhost' });
  await setTestApp(
    new Koa()
      .use((ctx, next) => {
        Object.defineProperty(ctx, 'origin', { value: 'http://app.org.localhost' });
        return next();
      })
      .use(boomMiddleware())
      .use(appRouter),
  );
});

it('should generate and save cache the Bulma styles', async () => {
  const spy = import.meta.jest.spyOn(sass, 'renderSync');
  const themeCreatedPromise = new Promise<void>((resolve) => {
    Theme.afterCreate('afterCreate', () => {
      Theme.removeHook('afterCreate', 'resolveThemeCreated');
      resolve();
    });
  });

  const { data } = await request.get<string>(`/bulma/${bulma.version}/bulma.min.css`, {
    params: { primaryColor: '#ffffff' },
  });
  await themeCreatedPromise;

  // Second request to check if sass is only called once.
  await request.get<string>(`/bulma/${bulma.version}/bulma.min.css`, {
    params: { primaryColor: '#ffffff' },
  });

  const count = await Theme.count();
  const cachedTheme = await Theme.findOne({ where: { primaryColor: '#ffffff' } });

  expect(count).toBe(1);
  expect(spy).toHaveBeenCalledTimes(1);
  expect(cachedTheme).toMatchObject({
    ...omit(baseTheme, ['font', 'tileLayer']),
    id: expect.any(Number),
    primaryColor: '#ffffff',
  });
  expect(data).toBe(cachedTheme.css);
});
