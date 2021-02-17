import { request, setTestApp } from 'axios-test-instance';

import { App, BlockAsset, BlockVersion, Organization } from '../../models';
import { setArgv } from '../../utils/argv';
import { createServer } from '../../utils/createServer';
import * as render from '../../utils/render';
import { closeTestSchema, createTestSchema, truncate } from '../../utils/test/testSchema';

let templateName: string;
let templateParams: any;

beforeAll(createTestSchema('approuter'));

beforeAll(async () => {
  await Organization.create({ id: 'test' });
  await Organization.create({ id: 'appsemble' });

  await BlockVersion.bulkCreate([
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
      name: 'a',
      version: '0.0.0',
      filename: 'a0.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      name: 'a',
      version: '0.0.0',
      filename: 'a0.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      name: 'a',
      version: '0.0.1',
      filename: 'a1.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      name: 'a',
      version: '0.0.1',
      filename: 'a1.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      name: 'b',
      version: '0.0.0',
      filename: 'b0.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      name: 'b',
      version: '0.0.0',
      filename: 'b0.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      name: 'b',
      version: '0.0.2',
      filename: 'b2.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'test',
      name: 'b',
      version: '0.0.2',
      filename: 'b2.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      name: 'a',
      version: '0.1.0',
      filename: 'a0.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      name: 'a',
      version: '0.1.0',
      filename: 'a0.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      name: 'a',
      version: '0.1.1',
      filename: 'a1.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      name: 'a',
      version: '0.1.1',
      filename: 'a1.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      name: 'b',
      version: '0.1.0',
      filename: 'b0.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      name: 'b',
      version: '0.1.0',
      filename: 'b0.css',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      name: 'b',
      version: '0.1.2',
      filename: 'b2.js',
      content: Buffer.from(''),
    },
    {
      OrganizationId: 'appsemble',
      name: 'b',
      version: '0.1.2',
      filename: 'b2.css',
      content: Buffer.from(''),
    },
  ]);
  await App.create({
    OrganizationId: 'test',
    definition: {
      pages: [
        {
          blocks: [
            { type: '@test/a', version: '0.0.0' },
            { type: 'a', version: '0.1.0' },
            { type: 'a', version: '0.1.0' },
          ],
        },
        {
          type: 'flow',
          subPages: [
            {
              blocks: [
                { type: 'a', version: '0.1.0' },
                {
                  type: 'a',
                  version: '0.1.1',
                  actions: {
                    whatever: {
                      blocks: [{ type: '@test/b', version: '0.0.2' }],
                    },
                  },
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
  setArgv({ host: 'http://host.example', secret: 'test' });
  const server = await createServer({
    middleware(ctx, next) {
      Object.defineProperty(ctx, 'origin', { value: 'http://app.test.host.example' });
      Object.defineProperty(ctx, 'hostname', { value: 'app.test.host.example' });
      return next();
    },
  });
  await setTestApp(server);
});

beforeEach(() => {
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
});

afterEach(truncate);

afterAll(closeTestSchema);

it('should render the index page', async () => {
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
    definition: {
      pages: [
        {
          blocks: [
            { type: '@test/a', version: '0.0.0' },
            { type: 'a', version: '0.1.0' },
            { type: 'a', version: '0.1.0' },
          ],
        },
        {
          type: 'flow',
          subPages: [
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
