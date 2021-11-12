import { baseTheme } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import bulma from 'bulma/package.json';
import Koa from 'koa';
import { omit } from 'lodash';
import sass from 'sass';

import { appRouter } from '.';
import { boomMiddleware } from '../../middleware/boom';
import { Theme } from '../../models';
import { setArgv } from '../../utils/argv';
import { closeTestSchema, createTestSchema, truncate } from '../../utils/test/testSchema';

beforeAll(createTestSchema('bulmahandler'));

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

afterEach(truncate);

afterAll(closeTestSchema);

it('should generate and save cache the Bulma styles', async () => {
  const spy = jest.spyOn(sass, 'renderSync');
  const { data } = await request.get<string>(`/bulma/${bulma.version}/bulma.min.css`, {
    params: { primaryColor: '#ffffff' },
  });

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
