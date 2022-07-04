import { install, InstalledClock } from '@sinonjs/fake-timers';
import { request, setTestApp } from 'axios-test-instance';

import { App, BlockAsset, BlockVersion, Organization } from '../../models';
import { setArgv } from '../../utils/argv';
import { createServer } from '../../utils/createServer';
import * as render from '../../utils/render';
import { useTestDatabase } from '../../utils/test/testSchema';

let templateName: string;
let templateParams: any;
let requestURL: URL;
let clock: InstalledClock;

useTestDatabase('approuter');

beforeEach(async () => {
  await Organization.create({ id: 'test' });
  await Organization.create({ id: 'appsemble' });

  const [a00, a01, b00, b02, a10, a11, b10, b12] = await BlockVersion.bulkCreate([
    { name: 'a', OrganizationId: 'test', version: '0.0.0' },
    { name: 'a', OrganizationId: 'test', version: '0.0.1' },
    { name: 'b', OrganizationId: 'test', version: '0.0.0' },
    { name: 'b', OrganizationId: 'test', version: '0.0.2' },
    { name: 'a', OrganizationId: 'appsemble', version: '0.1.0' },
    { name: 'a', OrganizationId: 'appsemble', version: '0.1.1' },
    { name: 'b', OrganizationId: 'appsemble', version: '0.1.0' },
    { name: 'b', OrganizationId: 'appsemble', version: '0.1.2' },
  ]);
  await BlockAsset.bulkCreate([
    {
      OrganizationId: 'test',
      BlockVersionId: a00.id,
      filename: 'a0.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      BlockVersionId: a00.id,
      filename: 'a0.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      BlockVersionId: a01.id,
      filename: 'a1.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      BlockVersionId: a01.id,
      filename: 'a1.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      BlockVersionId: b00.id,
      filename: 'b0.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      BlockVersionId: b00.id,
      filename: 'b0.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      BlockVersionId: b02.id,
      filename: 'b2.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      BlockVersionId: b02.id,
      filename: 'b2.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: a10.id,
      filename: 'a0.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: a10.id,
      filename: 'a0.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: a11.id,
      filename: 'a1.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: a11.id,
      filename: 'a1.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: b10.id,
      filename: 'b0.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: b10.id,
      filename: 'b0.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: b12.id,
      filename: 'b2.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      BlockVersionId: b12.id,
      filename: 'b2.css',
      content: Buffer.from(''),
    },
  ]);
  setArgv({ host: 'http://host.example', secret: 'test' });
  const server = await createServer({
    middleware(ctx, next) {
      Object.defineProperty(ctx, 'origin', { get: () => requestURL.origin });
      Object.defineProperty(ctx, 'hostname', { get: () => requestURL.hostname });
      return next();
    },
  });
  await setTestApp(server);
});

beforeEach(() => {
  clock = install();
  requestURL = new URL('http://app.test.host.example');
  // eslint-disable-next-line require-await
  jest.spyOn(render, 'render').mockImplementation(async (ctx, name, params) => {
    templateName = name;
    templateParams = params;
    ctx.body = '<!doctype html>';
    ctx.type = 'html';
  });
});

afterEach(() => {
  templateName = undefined;
  templateParams = undefined;
  clock.uninstall();
});

it('should render the index page', async () => {
  await App.create({
    OrganizationId: 'test',
    definition: {
      name: 'Test App',
      pages: [
        {
          name: 'Test Page',
          blocks: [
            { type: '@test/a', version: '0.0.0' },
            { type: 'a', version: '0.1.0' },
            { type: 'a', version: '0.1.0' },
          ],
        },
        {
          name: 'Test Page with Flow',
          type: 'flow',
          steps: [
            {
              blocks: [
                { type: 'a', version: '0.1.0' },
                {
                  type: 'a',
                  version: '0.1.1',
                  actions: { whatever: { blocks: [{ type: '@test/b', version: '0.0.2' }] } },
                },
              ],
            },
          ],
        },
      ],
    },
    path: 'app',
    vapidPublicKey: '',
    vapidPrivateKey: '',
  });
  const { headers, status } = await request.get('/');
  expect(templateName).toBe('app/index.html');
  expect(status).toBe(200);
  expect(headers['content-type']).toBe('text/html; charset=utf-8');
  const [, settingsString] = templateParams.settings.match(
    /^<script>window.settings=(.*)<\/script>$/,
  );
  const settings = JSON.parse(settingsString);
  expect(settings).toStrictEqual({
    apiUrl: 'http://host.example',
    appUpdated: '1970-01-01T00:00:00.000Z',
    blockManifests: [
      {
        name: '@test/a',
        version: '0.0.0',
        layout: null,
        actions: null,
        events: null,
        files: ['a0.js', 'a0.css'],
      },
      {
        name: '@test/b',
        version: '0.0.2',
        layout: null,
        actions: null,
        events: null,
        files: ['b2.js', 'b2.css'],
      },
      {
        name: '@appsemble/a',
        version: '0.1.0',
        layout: null,
        actions: null,
        events: null,
        files: ['a0.js', 'a0.css'],
      },
      {
        name: '@appsemble/a',
        version: '0.1.1',
        layout: null,
        actions: null,
        events: null,
        files: ['a1.js', 'a1.css'],
      },
    ],
    id: 1,
    vapidPublicKey: '',
    languages: ['en'],
    logins: [],
    showAppsembleLogin: false,
    showAppsembleOAuth2Login: true,
    definition: {
      name: 'Test App',
      pages: [
        {
          name: 'Test Page',
          blocks: [
            { type: '@test/a', version: '0.0.0' },
            { type: 'a', version: '0.1.0' },
            { type: 'a', version: '0.1.0' },
          ],
        },
        {
          name: 'Test Page with Flow',
          type: 'flow',
          steps: [
            {
              blocks: [
                { type: 'a', version: '0.1.0' },
                {
                  type: 'a',
                  version: '0.1.1',
                  actions: { whatever: { blocks: [{ type: '@test/b', version: '0.0.2' }] } },
                },
              ],
            },
          ],
        },
      ],
    },
  });
});

it('should render a 404 page if no app is found', async () => {
  const { headers, status } = await request.get('/');
  expect(templateName).toBe('app/error.html');
  expect(status).toBe(404);
  expect(headers['content-type']).toBe('text/html; charset=utf-8');
  expect(templateParams).toStrictEqual({
    bulmaURL: expect.any(String),
    faURL: expect.any(String),
    message: 'The app you are looking for could not be found.',
  });
});

it('should redirect if only the organization id is given', async () => {
  requestURL = new URL('http://org.host.example');
  const { headers, status } = await request.get('/');
  expect(status).toBe(302);
  expect(headers.location).toBe('http://host.example/organizations/org');
});

it('should if the app has a custom domain', async () => {
  requestURL = new URL('http://app.test.host.example');
  await App.create({
    OrganizationId: 'test',
    definition: {
      name: 'Test App',
      pages: [],
    },
    path: 'app',
    domain: 'custom.example',
    vapidPublicKey: '',
    vapidPrivateKey: '',
  });
  const { headers, status } = await request.get('/en?query=param');
  expect(status).toBe(302);
  expect(headers.location).toBe('http://custom.example/en?query=param');
});

it('should redirect to the app root if the organization id is disallowed', async () => {
  requestURL = new URL('http://www.host.example');
  const { headers, status } = await request.get('/');
  expect(status).toBe(302);
  expect(headers.location).toBe('http://host.example');
});
