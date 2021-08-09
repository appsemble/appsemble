import { createFixtureStream, createFormData, readFixture } from '@appsemble/node-utils';
import { Clock, install } from '@sinonjs/fake-timers';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { request, setTestApp } from 'axios-test-instance';
import FormData from 'form-data';

import {
  App,
  AppBlockStyle,
  AppRating,
  AppScreenshot,
  AppSnapshot,
  BlockAsset,
  BlockMessages,
  BlockVersion,
  Member,
  Organization,
  User,
} from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import { authorizeStudio, createTestUser } from '../utils/test/authorization';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';

let organization: Organization;
let clock: Clock;
let user: User;

beforeAll(createTestSchema('apps'));

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  clock = install();

  user = await createTestUser();
  organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });

  await Organization.create({ id: 'appsemble', name: 'Appsemble' });

  await BlockVersion.create({
    name: 'test',
    OrganizationId: 'appsemble',
    version: '0.0.0',
    parameters: {
      type: 'object',
      properties: {
        foo: {
          type: 'number',
        },
      },
    },
  });
});

afterEach(truncate);

afterEach(() => {
  clock.uninstall();
});

afterAll(closeTestSchema);

describe('queryApps', () => {
  it('should return an empty array of apps', async () => {
    const response = await request.get('/api/apps');

    expect(response).toMatchObject({
      status: 200,
      data: [],
    });
  });

  it('should return an array of apps', async () => {
    const appA = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );
    const appB = await App.create(
      {
        path: 'another-app',
        definition: { name: 'Another App', defaultPage: 'Another Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    const response = await request.get('/api/apps');

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: appA.id,
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          domain: null,
          private: false,
          path: 'test-app',
          iconUrl: null,
          definition: appA.definition,
          OrganizationId: appA.OrganizationId,
          OrganizationName: 'Test Organization',
        },
        {
          id: appB.id,
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          domain: null,
          private: false,
          path: 'another-app',
          iconUrl: null,
          definition: appB.definition,
          OrganizationId: appB.OrganizationId,
          OrganizationName: 'Test Organization',
        },
      ],
    });
  });

  it('should not include private apps when fetching all apps', async () => {
    const appA = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );
    await App.create(
      {
        path: 'another-app',
        private: true,
        definition: { name: 'Another App', defaultPage: 'Another Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    const response = await request.get('/api/apps');
    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: appA.id,
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          domain: null,
          private: false,
          path: 'test-app',
          iconUrl: null,
          definition: appA.definition,
          OrganizationId: appA.OrganizationId,
          OrganizationName: 'Test Organization',
        },
      ],
    });
  });

  it('should sort apps by its rating', async () => {
    const userB = await User.create();
    const appA = await App.create({
      path: 'test-app',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    await AppRating.create({
      AppId: appA.id,
      UserId: user.id,
      rating: 5,
      description: 'This is a test rating',
    });
    await AppRating.create({
      AppId: appA.id,
      UserId: userB.id,
      rating: 4,
      description: 'This is also a test rating',
    });

    const appB = await App.create({
      path: 'another-app',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const appC = await App.create({
      path: 'yet-another-app',
      definition: { name: 'Another App', defaultPage: 'Another Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    await AppRating.create({
      AppId: appC.id,
      UserId: user.id,
      rating: 3,
      description: 'This is a test rating',
    });

    const response = await request.get('/api/apps');

    expect(response).toMatchObject({
      status: 200,
      data: [
        expect.objectContaining({ id: appA.id, rating: { count: 2, average: 4.5 } }),
        expect.objectContaining({ id: appC.id, rating: { count: 1, average: 3 } }),
        expect.objectContaining({ id: appB.id }),
      ],
    });
  });
});

describe('getAppById', () => {
  it('should return 404 when fetching a non-existent app', async () => {
    const response = await request.get('/api/apps/1');

    expect(response).toMatchObject({
      status: 404,
      data: {
        message: 'App not found',
      },
    });
  });

  it('should fetch an existing app', async () => {
    const appA = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );
    const response = await request.get(`/api/apps/${appA.id}`);

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: appA.id,
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        domain: null,
        private: false,
        path: 'test-app',
        iconUrl: null,
        definition: appA.definition,
        OrganizationId: organization.id,
        OrganizationName: 'Test Organization',
        yaml: `name: Test App
defaultPage: Test Page
`,
      },
    });
  });

  it('should fetch the most recent snapshot', async () => {
    const app = await App.create({
      path: 'test-app',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    await AppSnapshot.create({ AppId: app.id, yaml: 'name: Test App\ndefaultPage Test Page\n' });
    clock.tick(3600);
    await AppSnapshot.create({ AppId: app.id, yaml: '{ name: Test App, defaultPage Test Page }' });
    const response = await request.get(`/api/apps/${app.id}`);

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: app.id,
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        domain: null,
        private: false,
        path: 'test-app',
        iconUrl: null,
        definition: app.definition,
        OrganizationId: organization.id,
        OrganizationName: 'Test Organization',
        yaml: '{ name: Test App, defaultPage Test Page }',
      },
    });
  });

  it('should resolve an icon url for an app with an icon', async () => {
    const app = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
        icon: await readFixture('nodejs-logo.png'),
      },
      { raw: true },
    );
    const response = await request.get(`/api/apps/${app.id}`);
    expect(response).toMatchObject({
      status: 200,
      data: {
        iconUrl: `/api/apps/${app.id}/icon?maskable=true&updated=1970-01-01T00%3A00%3A00.000Z`,
      },
    });
  });

  it('should resolve an icon url for an app with an organization icon fallback', async () => {
    await organization.update({
      icon: await readFixture('nodejs-logo.png'),
    });

    const app = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );
    const response = await request.get(`/api/apps/${app.id}`);
    expect(response).toMatchObject({
      status: 200,
      data: {
        iconUrl:
          '/api/organizations/testorganization/icon?background=%23ffffff&maskable=true&updated=1970-01-01T00%3A00%3A00.000Z',
      },
    });
  });

  it('should resolve an icon url for an app without an icon as null', async () => {
    const app = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );
    const response = await request.get(`/api/apps/${app.id}`);
    expect(response).toMatchObject({
      status: 200,
      data: {
        iconUrl: null,
      },
    });
  });
});

describe('queryMyApps', () => {
  it('should be able to fetch filtered apps', async () => {
    const appA = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    const organizationB = await Organization.create({
      id: 'testorganizationb',
      name: 'Test Organization B',
    });
    const appB = await App.create(
      {
        path: 'test-app-b',
        definition: { name: 'Test App B', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organizationB.id,
      },
      { raw: true },
    );

    authorizeStudio();
    const responseA = await request.get('/api/apps/me');

    await Member.create({ OrganizationId: organizationB.id, UserId: user.id, role: 'Member' });

    const responseB = await request.get('/api/apps/me');

    expect(responseA).toMatchObject({
      status: 200,
      data: [
        {
          id: appA.id,
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          domain: null,
          private: false,
          path: 'test-app',
          iconUrl: null,
          definition: appA.definition,
          OrganizationId: appA.OrganizationId,
          OrganizationName: 'Test Organization',
        },
      ],
    });
    expect(responseB).toMatchObject({
      status: 200,
      data: [
        {
          id: appA.id,
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          domain: null,
          private: false,
          path: 'test-app',
          iconUrl: null,
          definition: appA.definition,
          OrganizationId: appA.OrganizationId,
          OrganizationName: 'Test Organization',
        },
        {
          id: appB.id,
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          domain: null,
          private: false,
          path: 'test-app-b',
          iconUrl: null,
          definition: appB.definition,
          OrganizationId: appB.OrganizationId,
          OrganizationName: 'Test Organization B',
        },
      ],
    });
  });
});

describe('createApp', () => {
  it('should create an app', async () => {
    authorizeStudio();
    const createdResponse = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        icon: createFixtureStream('nodejs-logo.png'),
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [
                {
                  type: 'test',
                  version: '0.0.0',
                },
              ],
            },
          ],
        },
      }),
    );

    expect(createdResponse).toMatchObject({
      status: 201,
      data: {
        id: expect.any(Number),
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        domain: null,
        private: true,
        path: 'test-app',
        iconUrl: expect.stringMatching(/\/api\/apps\/\d+\/icon/),
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [
                {
                  type: 'test',
                  version: '0.0.0',
                },
              ],
            },
          ],
        },
        OrganizationId: organization.id,
        OrganizationName: 'Test Organization',
        yaml: `name: Test App
defaultPage: Test Page
pages:
  - name: Test Page
    blocks:
      - type: test
        version: 0.0.0
`,
        screenshotUrls: [],
      },
    });
    const { data: retrieved } = await request.get(`/api/apps/${createdResponse.data.id}`);
    expect(retrieved).toStrictEqual(createdResponse.data);
  });

  it('should accept screenshots', async () => {
    authorizeStudio();
    const createdResponse = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [{ name: 'Test Page', blocks: [{ type: 'test', version: '0.0.0' }] }],
        },
        icon: createFixtureStream('nodejs-logo.png'),
        screenshots: createFixtureStream('standing.png'),
      }),
    );

    expect(createdResponse).toMatchObject({
      status: 201,
      data: {
        id: expect.any(Number),
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        domain: null,
        private: true,
        path: 'test-app',
        iconUrl: expect.stringMatching(/\/api\/apps\/\d+\/icon/),
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [
                {
                  type: 'test',
                  version: '0.0.0',
                },
              ],
            },
          ],
        },
        OrganizationId: organization.id,
        OrganizationName: 'Test Organization',
        yaml: `name: Test App
defaultPage: Test Page
pages:
  - name: Test Page
    blocks:
      - type: test
        version: 0.0.0
`,
        screenshotUrls: ['/api/apps/1/screenshots/1'],
      },
    });
  });

  it('should not allow an upload without an app when creating an app', async () => {
    authorizeStudio();
    const form = new FormData();
    form.append('coreStyle', Buffer.from('body { color: red; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    const response = await request.post('/api/apps', form);

    expect(response).toMatchObject({
      status: 400,
      data: {
        errors: [
          {
            argument: 'OrganizationId',
            instance: {
              coreStyle: '',
            },
            message: 'requires property "OrganizationId"',
            name: 'required',
            path: [],
            property: 'instance',
            schema: {
              properties: {
                OrganizationId: {
                  $ref: '#/components/schemas/Organization/properties/id',
                },
                coreStyle: {
                  description: 'The custom style to apply to the core app.',
                  format: 'binary',
                  type: 'string',
                },
                definition: {
                  $ref: '#/components/schemas/AppDefinition',
                },
                domain: {
                  $ref: '#/components/schemas/App/properties/domain',
                },
                icon: {
                  description: 'The app icon.',
                  format: 'binary',
                  type: 'string',
                },
                iconBackground: {
                  description: 'The background color to use for the maskable icon.',
                  pattern: '^#[\\dA-Fa-f]{6}$',
                  type: 'string',
                },
                longDescription: {
                  $ref: '#/components/schemas/App/properties/longDescription',
                },
                maskableIcon: {
                  description: 'The app icon.',
                  format: 'binary',
                  type: 'string',
                },
                path: {
                  $ref: '#/components/schemas/App/properties/path',
                },
                private: {
                  $ref: '#/components/schemas/App/properties/private',
                },
                screenshots: {
                  description: 'Screenshots to showcase in the store',
                  items: {
                    format: 'binary',
                    type: 'string',
                  },
                  type: 'array',
                },
                sharedStyle: {
                  description: 'The custom style to apply to all parts of app.',
                  format: 'binary',
                  type: 'string',
                },
                template: {
                  $ref: '#/components/schemas/App/properties/template',
                },
                yaml: {
                  description: 'The original YAML definition used to define the app.',
                  format: 'binary',
                  type: 'string',
                },
              },
              required: ['OrganizationId', 'definition'],
              type: 'object',
            },
            stack: 'instance requires property "OrganizationId"',
          },
          {
            argument: 'definition',
            instance: {
              coreStyle: '',
            },
            message: 'requires property "definition"',
            name: 'required',
            path: [],
            property: 'instance',
            schema: {
              properties: {
                OrganizationId: {
                  $ref: '#/components/schemas/Organization/properties/id',
                },
                coreStyle: {
                  description: 'The custom style to apply to the core app.',
                  format: 'binary',
                  type: 'string',
                },
                definition: {
                  $ref: '#/components/schemas/AppDefinition',
                },
                domain: {
                  $ref: '#/components/schemas/App/properties/domain',
                },
                icon: {
                  description: 'The app icon.',
                  format: 'binary',
                  type: 'string',
                },
                iconBackground: {
                  description: 'The background color to use for the maskable icon.',
                  pattern: '^#[\\dA-Fa-f]{6}$',
                  type: 'string',
                },
                longDescription: {
                  $ref: '#/components/schemas/App/properties/longDescription',
                },
                maskableIcon: {
                  description: 'The app icon.',
                  format: 'binary',
                  type: 'string',
                },
                path: {
                  $ref: '#/components/schemas/App/properties/path',
                },
                private: {
                  $ref: '#/components/schemas/App/properties/private',
                },
                screenshots: {
                  description: 'Screenshots to showcase in the store',
                  items: {
                    format: 'binary',
                    type: 'string',
                  },
                  type: 'array',
                },
                sharedStyle: {
                  description: 'The custom style to apply to all parts of app.',
                  format: 'binary',
                  type: 'string',
                },
                template: {
                  $ref: '#/components/schemas/App/properties/template',
                },
                yaml: {
                  description: 'The original YAML definition used to define the app.',
                  format: 'binary',
                  type: 'string',
                },
              },
              required: ['OrganizationId', 'definition'],
              type: 'object',
            },
            stack: 'instance requires property "definition"',
          },
        ],
        message: 'Invalid content types found',
      },
    });
  });

  it('should not allow apps to be created without an organization.id', async () => {
    authorizeStudio();
    const response = await request.post(
      '/api/apps',
      createFormData({
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [
                {
                  type: 'test',
                  version: '0.0.1',
                },
              ],
            },
          ],
        },
      }),
    );

    expect(response).toMatchObject({
      status: 400,
      data: {
        errors: [
          {
            argument: 'OrganizationId',
            instance: {
              definition: {
                defaultPage: 'Test Page',
                name: 'Test App',
                pages: [
                  {
                    blocks: [
                      {
                        type: 'test',
                        version: '0.0.1',
                      },
                    ],
                    name: 'Test Page',
                  },
                ],
              },
            },
            message: 'requires property "OrganizationId"',
            name: 'required',
            path: [],
            property: 'instance',
            schema: {
              properties: {
                OrganizationId: {
                  $ref: '#/components/schemas/Organization/properties/id',
                },
                coreStyle: {
                  description: 'The custom style to apply to the core app.',
                  format: 'binary',
                  type: 'string',
                },
                definition: {
                  $ref: '#/components/schemas/AppDefinition',
                },
                domain: {
                  $ref: '#/components/schemas/App/properties/domain',
                },
                icon: {
                  description: 'The app icon.',
                  format: 'binary',
                  type: 'string',
                },
                iconBackground: {
                  description: 'The background color to use for the maskable icon.',
                  pattern: '^#[\\dA-Fa-f]{6}$',
                  type: 'string',
                },
                longDescription: {
                  $ref: '#/components/schemas/App/properties/longDescription',
                },
                maskableIcon: {
                  description: 'The app icon.',
                  format: 'binary',
                  type: 'string',
                },
                path: {
                  $ref: '#/components/schemas/App/properties/path',
                },
                private: {
                  $ref: '#/components/schemas/App/properties/private',
                },
                screenshots: {
                  description: 'Screenshots to showcase in the store',
                  items: {
                    format: 'binary',
                    type: 'string',
                  },
                  type: 'array',
                },
                sharedStyle: {
                  description: 'The custom style to apply to all parts of app.',
                  format: 'binary',
                  type: 'string',
                },
                template: {
                  $ref: '#/components/schemas/App/properties/template',
                },
                yaml: {
                  description: 'The original YAML definition used to define the app.',
                  format: 'binary',
                  type: 'string',
                },
              },
              required: ['OrganizationId', 'definition'],
              type: 'object',
            },
            stack: 'instance requires property "OrganizationId"',
          },
        ],
        message: 'Invalid content types found',
      },
    });
  });

  it('should not allow apps to be created for organizations the user does not belong to', async () => {
    authorizeStudio();
    const response = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: 'a',
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [
                {
                  type: 'test',
                  version: '0.0.1',
                },
              ],
            },
          ],
        },
      }),
    );

    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'User is not part of this organization.',
        statusCode: 403,
      },
    });
  });

  it('should not allow to create an app using non-existent blocks', async () => {
    authorizeStudio();
    const response = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [
                {
                  type: '@non/existent',
                  version: '0.0.0',
                },
              ],
            },
          ],
        },
      }),
    );

    expect(response).toMatchObject({
      status: 400,
      data: {
        data: {
          'pages.0.blocks.0': 'Unknown block type “@non/existent”',
        },
        error: 'Bad Request',
        message: 'Appsemble definition is invalid.',
        statusCode: 400,
      },
    });
  });

  it('should not allow to create an app using non-existent block versions', async () => {
    authorizeStudio();
    const response = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [
                {
                  type: 'test',
                  version: '0.0.1',
                },
              ],
            },
          ],
        },
      }),
    );

    expect(response).toMatchObject({
      status: 400,
      data: {
        data: {
          'pages.0.blocks.0': 'Unknown block type “@appsemble/test”',
        },
        error: 'Bad Request',
        message: 'Appsemble definition is invalid.',
        statusCode: 400,
      },
    });
  });

  it('should not allow to create an app using invalid block parameters', async () => {
    authorizeStudio();
    const response = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [
                {
                  type: 'test',
                  version: '0.0.0',
                  parameters: {
                    foo: 'invalid',
                  },
                },
              ],
            },
          ],
        },
      }),
    );

    expect(response).toMatchObject({
      status: 400,
      data: {
        data: {
          'pages.0.blocks.0.parameters.foo': 'is not of a type(s) number',
        },
        error: 'Bad Request',
        message: 'Appsemble definition is invalid.',
        statusCode: 400,
      },
    });
  });

  it('should handle app path conflicts on create', async () => {
    authorizeStudio();
    await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [{ type: 'test', version: '0.0.0' }],
            },
          ],
        },
      }),
    );

    const response = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [{ type: 'test', version: '0.0.0' }],
            },
          ],
        },
      }),
    );

    expect(response).toMatchObject({
      status: 201,
      data: {
        path: 'test-app-2',
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [{ type: 'test', version: '0.0.0' }],
            },
          ],
        },
      },
    });
  });

  it('should fall back to append random bytes to the end of the app path after 10 attempts', async () => {
    await App.bulkCreate(
      Array.from({ length: 11 }, (unused, index) => ({
        path: index ? `test-app-${index}` : 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: `a${index}`,
        vapidPrivateKey: `b${index}`,
        OrganizationId: organization.id,
      })),
    );
    authorizeStudio();
    const response = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [{ type: 'test', version: '0.0.0' }],
            },
          ],
        },
      }),
    );

    expect(response).toMatchObject({
      status: 201,
      data: expect.objectContaining({
        path: expect.stringMatching(/test-app-(\w){10}/),
      }),
    });
  });

  it('should allow stylesheets to be included when creating an app', async () => {
    const form = createFormData({
      OrganizationId: organization.id,
      definition: {
        name: 'Foobar',
        defaultPage: 'Test Page',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      },
    });
    form.append('coreStyle', Buffer.from('body { color: blue; }'), {
      contentType: 'text/css',
      filename: 'test.css',
    });
    form.append('sharedStyle', Buffer.from(':root { --primary-color: purple; }'), {
      contentType: 'text/css',
      filename: 'test.css',
    });
    authorizeStudio();
    const response = await request.post('/api/apps', form);

    const coreStyle = await request.get(`/api/apps/${response.data.id}/style/core`);
    const sharedStyle = await request.get(`/api/apps/${response.data.id}/style/shared`);

    expect(response).toMatchObject({ status: 201 });
    expect(coreStyle).toMatchObject({ status: 200, data: 'body { color: blue; }' });
    expect(sharedStyle).toMatchObject({ status: 200, data: ':root { --primary-color: purple; }' });
  });

  it('should not allow invalid core stylesheets when creating an app', async () => {
    const form = createFormData({
      OrganizationId: organization.id,
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      },
    });
    form.append('coreStyle', Buffer.from('this is invalid css'), {
      contentType: 'text/css',
      filename: 'test.css',
    });
    authorizeStudio();
    const response = await request.post('/api/apps', form);

    expect(response.status).toBe(400);
  });

  it('should not allow invalid shared stylesheets when creating an app', async () => {
    const form = createFormData({
      OrganizationId: organization.id,
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        path: 'a',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'testblock' }],
          },
        ],
      },
    });
    form.append('sharedStyle', Buffer.from('this is invalid css'), {
      contentType: 'text/css',
      filename: 'test.css',
    });
    authorizeStudio();
    const response = await request.post('/api/apps', form);

    expect(response).toMatchObject({
      status: 400,
      data: {},
    });
  });

  describe('block synchronization', () => {
    let mock: MockAdapter;

    beforeEach(() => {
      setArgv({ host: 'http://localhost', remote: 'https://appsemble.example', secret: 'test' });
      mock = new MockAdapter(axios);
    });

    afterEach(() => {
      setArgv({ host: 'http://localhost', secret: 'test' });
      mock.reset();
    });

    it('should not synchronize if the remote returns an invalid block name', async () => {
      authorizeStudio();

      mock
        .onGet('https://appsemble.example/api/blocks/@appsemble/upstream/versions/1.2.3')
        .reply(200, {
          name: '@appsemble/invalid',
          version: '1.2.3',
        });
      const response = await request.post(
        '/api/apps',
        createFormData({
          OrganizationId: organization.id,
          path: 'a',
          definition: {
            name: 'Test App',
            defaultPage: 'Test Page',
            pages: [
              {
                name: 'Test Page',
                blocks: [{ type: 'upstream', version: '1.2.3' }],
              },
            ],
          },
        }),
      );
      expect(response).toMatchObject({
        status: 400,
        data: {
          data: {
            'pages.0.blocks.0': 'Unknown block type “@appsemble/upstream”',
          },
          error: 'Bad Request',
          message: 'Appsemble definition is invalid.',
          statusCode: 400,
        },
      });
    });

    it('should not synchronize if the remote returns an invalid block version', async () => {
      authorizeStudio();

      mock
        .onGet('https://appsemble.example/api/blocks/@appsemble/upstream/versions/1.2.3')
        .reply(200, {
          name: '@appsemble/upstream',
          version: '3.2.1',
        });
      const response = await request.post(
        '/api/apps',
        createFormData({
          OrganizationId: organization.id,
          path: 'a',
          definition: {
            name: 'Test App',
            defaultPage: 'Test Page',
            pages: [
              {
                name: 'Test Page',
                blocks: [{ type: 'upstream', version: '1.2.3' }],
              },
            ],
          },
        }),
      );
      expect(response).toMatchObject({
        status: 400,
        data: {
          data: {
            'pages.0.blocks.0': 'Unknown block type “@appsemble/upstream”',
          },
          error: 'Bad Request',
          message: 'Appsemble definition is invalid.',
          statusCode: 400,
        },
      });
    });

    it('should store the remote block in the local database', async () => {
      authorizeStudio();

      mock
        .onGet('https://appsemble.example/api/blocks/@appsemble/upstream/versions/1.2.3')
        .reply(200, {
          actions: {},
          description: 'This is a block',
          events: {},
          files: ['a.js', 'b.css'],
          iconUrl: null,
          languages: ['en'],
          layout: 'float',
          longDescription: 'This is a useful block.',
          name: '@appsemble/upstream',
          parameters: {},
          version: '1.2.3',
        });
      mock
        .onGet('https://appsemble.example/api/blocks/@appsemble/upstream/versions/1.2.3/asset')
        .reply(({ params: { filename } }) => {
          switch (filename) {
            case 'a.js':
              return [
                200,
                Buffer.from('console.log("a");\n'),
                { 'content-type': 'application/javascript' },
              ];
            case 'b.css':
              return [200, Buffer.from('b{background:blue;}\n'), { 'content-type': 'text/css' }];
            default:
              return [404];
          }
        });
      mock
        .onGet(
          'https://appsemble.example/api/blocks/@appsemble/upstream/versions/1.2.3/messages/en',
        )
        .reply(200, { hello: 'world' });
      const response = await request.post(
        '/api/apps',
        createFormData({
          OrganizationId: organization.id,
          path: 'a',
          definition: {
            name: 'Test App',
            defaultPage: 'Test Page',
            pages: [
              {
                name: 'Test Page',
                blocks: [{ type: 'upstream', version: '1.2.3' }],
              },
            ],
          },
        }),
      );
      expect(response).toMatchObject({ status: 201 });
      const block = await BlockVersion.findOne({
        where: { OrganizationId: 'appsemble', name: 'upstream' },
        include: [BlockAsset, BlockMessages],
      });
      expect(block).toMatchObject({
        actions: {},
        description: 'This is a block',
        events: {},
        icon: null,
        layout: 'float',
        longDescription: 'This is a useful block.',
        name: 'upstream',
        OrganizationId: 'appsemble',
        parameters: {},
        version: '1.2.3',
        BlockAssets: [
          {
            filename: 'a.js',
            mime: 'application/javascript',
            content: Buffer.from('console.log("a");\n'),
          },
          {
            filename: 'b.css',
            mime: 'text/css',
            content: Buffer.from('b{background:blue;}\n'),
          },
        ],
        BlockMessages: [{ language: 'en', messages: { hello: 'world' } }],
      });
    });
  });

  it('should allow for dry runs without creating an app', async () => {
    authorizeStudio();
    const createdResponse = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        icon: createFixtureStream('nodejs-logo.png'),
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [
                {
                  type: 'test',
                  version: '0.0.0',
                },
              ],
            },
          ],
        },
      }),
      { params: { dryRun: true } },
    );

    const appCount = await App.count();
    expect(createdResponse.status).toStrictEqual(204);
    expect(appCount).toStrictEqual(0);
  });

  it('should still return errors during dry runs', async () => {
    authorizeStudio();
    const createdResponse = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        icon: createFixtureStream('nodejs-logo.png'),
        definition: {
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [
                {
                  type: 'test',
                  version: '0.0.0',
                },
              ],
            },
          ],
        },
      }),
      { params: { dryRun: true } },
    );

    const appCount = await App.count();
    expect(createdResponse.status).toStrictEqual(400);
    expect(createdResponse.data).toStrictEqual({
      errors: [
        {
          argument: 'name',
          instance: {
            defaultPage: 'Test Page',
            pages: [
              {
                blocks: [
                  {
                    type: 'test',
                    version: '0.0.0',
                  },
                ],
                name: 'Test Page',
              },
            ],
          },
          message: 'requires property "name"',
          name: 'required',
          path: ['definition'],
          property: 'instance.definition',
          schema: {
            properties: {
              anchors: {
                description: 'Helper property that can be used to store YAML anchors.',
                items: {},
                minItems: 1,
                type: 'array',
              },
              cron: {
                additionalProperties: {
                  $ref: '#/components/schemas/CronDefinition',
                },
                description: 'A list of cron jobs that are associated with this app.',
                type: 'object',
              },
              defaultLanguage: {
                default: 'en',
                description: 'The default language for the app.',
                minLength: 2,
                type: 'string',
              },
              defaultPage: {
                description: `The name of the page that should be displayed when the app is initially loaded.

This **must** match the name of a page defined for the app.
`,
                type: 'string',
              },
              description: {
                description: `A short description describing the app.

This will be displayed on the app store.
`,
                maxLength: 80,
                type: 'string',
              },
              layout: {
                $ref: '#/components/schemas/AppLayoutDefinition',
                description: 'Properties related to the layout of the app.',
              },
              login: {
                description: 'Where the login and logout buttons should be located.',
                enum: ['navigation', 'menu', 'hidden'],
                type: 'string',
              },
              name: {
                description: `The human readable name of the app.

This will be displayed for example on the home screen or in the browser tab.
`,
                maxLength: 30,
                minLength: 1,
                type: 'string',
              },
              notifications: {
                description: `The strategy to use for apps to subscribe to push notifications.

If specified, push notifications can be sent to subscribed users via the _Notifications_ tab in the
app details page in Appsemble Studio. Setting this to \`opt-in\` allows for users to opt into
receiving push notifications by pressing the subscribe button in the App settings page. Setting this
to \`startup\` will cause Appsemble to immediately request for the permission upon opening the app.

> **Note**: Setting \`notifications\` to \`startup\` is not recommended, due to its invasive nature.
`,
                enum: ['opt-in', 'startup'],
                type: 'string',
              },
              pages: {
                description: 'The pages of the app.',
                items: {
                  oneOf: [
                    {
                      $ref: '#/components/schemas/PageDefinition',
                    },
                    {
                      $ref: '#/components/schemas/TabsPageDefinition',
                    },
                    {
                      $ref: '#/components/schemas/FlowPageDefinition',
                    },
                  ],
                },
                minItems: 1,
                type: 'array',
              },
              resources: {
                $ref: '#/components/schemas/ResourceDefinition',
                description: 'Resource definitions that may be used by the app.',
              },
              roles: {
                description: `The list of roles that are allowed to view this app.

This list is used as the default roles for the roles property on pages and blocks, which can be
overridden by defining them for a specific page or block. Note that these roles must be defined in
\`security.roles\`.
`,
                items: {
                  type: 'string',
                },
                type: 'array',
              },
              security: {
                $ref: '#/components/schemas/SecurityDefinition',
                description: 'Role definitions that may be used by the app.',
              },
              theme: {
                $ref: '#/components/schemas/Theme',
              },
            },
            required: ['name', 'defaultPage', 'pages'],
            type: 'object',
          },
          stack: 'instance.definition requires property "name"',
        },
      ],
      message: 'Invalid content types found',
    });
    expect(appCount).toStrictEqual(0);
  });
});

describe('patchApp', () => {
  it('should update an app', async () => {
    const app = await App.create(
      {
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        path: 'test-app',
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({
        private: 'true',
        definition: {
          name: 'Foobar',
          defaultPage: app.definition.defaultPage,
          pages: [
            {
              name: 'Test Page',
              blocks: [{ type: 'test', version: '0.0.0' }],
            },
          ],
        },
      }),
    );

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: app.id,
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        domain: null,
        private: true,
        path: 'test-app',
        iconUrl: null,
        OrganizationId: organization.id,
        OrganizationName: 'Test Organization',
        definition: {
          name: 'Foobar',
          defaultPage: app.definition.defaultPage,
          pages: [
            {
              name: 'Test Page',
              blocks: [{ type: 'test', version: '0.0.0' }],
            },
          ],
        },
        yaml: `name: Foobar
defaultPage: Test Page
pages:
  - name: Test Page
    blocks:
      - type: test
        version: 0.0.0
`,
      },
    });
  });

  it('should not update a non-existent app', async () => {
    authorizeStudio();
    const response = await request.patch(
      '/api/apps/1',
      createFormData({
        definition: {
          name: 'Foobar',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [{ type: 'test', version: '0.0.0' }],
            },
          ],
        },
      }),
    );

    expect(response).toMatchObject({
      status: 404,
      data: {
        message: 'App not found',
      },
    });
  });

  it('should not update an app if it is currently locked', async () => {
    const app = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      locked: true,
    });

    const form = createFormData({
      definition: {
        name: 'Foobar',
        defaultPage: app.definition.defaultPage,
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      },
    });
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}`, form);

    expect(response).toMatchObject({ status: 403, data: { message: 'App is currently locked.' } });
  });

  it('should ignore the lock if force is set to true', async () => {
    const app = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      OrganizationName: 'Test Organization',
      locked: true,
    });

    const form = createFormData({
      definition: {
        name: 'Foobar',
        defaultPage: app.definition.defaultPage,
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      },
      force: true,
    });
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}`, form);

    expect(response).toMatchObject({ status: 200 });
  });

  it('should verify the YAML on validity when updating an app', async () => {
    const app = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({
        definition: {
          name: 'Foobar',
          defaultPage: app.definition.defaultPage,
          pages: [
            {
              name: 'Test Page',
              blocks: [{ type: 'test', version: '0.0.0' }],
            },
          ],
        },
        yaml: Buffer.from('name: foo\nname: bar'),
      }),
    );

    expect(response).toMatchObject({
      status: 400,
      data: {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Provided YAML was invalid.',
      },
    });
  });

  it('should verify if the supplied YAML is the same as the app definition when updating an app', async () => {
    const app = await App.create({
      path: 'test-app',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({
        definition: {
          name: 'Foobar',
          defaultPage: app.definition.defaultPage,
          pages: [
            {
              name: 'Test Page',
              blocks: [{ type: 'test', version: '0.0.0' }],
            },
          ],
        },
        yaml: Buffer.from(`name: Barfoo
defaultPage: Test Page
pages:
- name: Test page
  blocks:
    - type: test
      version: 0.0.0
`),
      }),
    );

    expect(response).toMatchObject({
      status: 400,
      data: {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Provided YAML was not equal to definition when converted.',
      },
    });
  });

  it('should allow for formatted YAML when updating an app', async () => {
    const app = await App.create({
      path: 'test-app',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const yaml = `# Hi I'm a comment
name: Foobar
defaultPage: &titlePage 'Test Page' # This page is used for testing!

pages:
  - blocks:
      - type: test
        version: 0.0.0
    name: *titlePage`;

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({
        yaml: Buffer.from(yaml),
        definition: {
          name: 'Foobar',
          defaultPage: app.definition.defaultPage,
          pages: [
            {
              name: 'Test Page',
              blocks: [{ type: 'test', version: '0.0.0' }],
            },
          ],
        },
      }),
    );

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: app.id,
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        domain: null,
        private: false,
        path: 'test-app',
        iconUrl: null,
        OrganizationId: organization.id,
        OrganizationName: 'Test Organization',
        definition: {
          name: 'Foobar',
          defaultPage: app.definition.defaultPage,
          pages: [
            {
              name: 'Test Page',
              blocks: [{ type: 'test', version: '0.0.0' }],
            },
          ],
        },
        yaml,
      },
    });
  });

  it('should update the app domain', async () => {
    const app = await App.create({
      path: 'foo',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({ domain: 'appsemble.app' }),
    );

    expect(response).toMatchObject({
      status: 200,
      data: expect.objectContaining({
        domain: 'appsemble.app',
      }),
    });
  });

  it('should set the app domain to null', async () => {
    const app = await App.create(
      {
        path: 'foo',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}`, createFormData({ domain: '' }));

    expect(response).toMatchObject({
      status: 200,
      data: expect.objectContaining({
        domain: null,
      }),
    });
  });

  it('should save formatted YAML when updating an app', async () => {
    const app = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    const yaml = `# Hi I'm a comment
name: Foobar
defaultPage: &titlePage 'Test Page' # This page is used for testing!

pages:
  - blocks:
      - type: test
        version: 0.0.0
    name: *titlePage`;
    const buffer = Buffer.from(yaml);

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({
        definition: {
          name: 'Foobar',
          defaultPage: app.definition.defaultPage,
          pages: [
            {
              name: 'Test Page',
              blocks: [{ type: 'test', version: '0.0.0' }],
            },
          ],
        },
        yaml: buffer,
      }),
    );

    const responseBuffer = Buffer.from(response.data.yaml);
    expect(responseBuffer).toStrictEqual(buffer);
  });

  it('should not update an app of another organization', async () => {
    const newOrganization = await Organization.create({ id: 'Test Organization 2' });
    const app = await App.create({
      path: 'test-app',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: newOrganization.id,
    });

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({
        definition: {
          name: 'Foobar',
          defaultPage: app.definition.defaultPage,
          pages: [
            {
              name: 'Test Page',
              blocks: [{ type: 'test', version: '0.0.0' }],
            },
          ],
        },
      }),
    );

    expect(response).toMatchObject({
      status: 403,
      data: {
        statusCode: 403,
        error: 'Forbidden',
        message: 'User is not part of this organization.',
      },
    });
  });

  it('should validate an app on creation', async () => {
    authorizeStudio();
    const response = await request.post('/api/apps', createFormData({ foo: 'bar' }));

    expect(response).toMatchObject({
      status: 400,
      data: {},
    });
  });

  it('should validate an app on update', async () => {
    const app = await App.create({
      path: 'foo',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({ definition: { name: 'Foobar' } }),
    );

    expect(response).toMatchObject({
      status: 400,
      data: {},
    });
  });

  it('should validate and update css when updating an app', async () => {
    const app = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const form = createFormData({
      definition: {
        name: 'Foobar',
        defaultPage: app.definition.defaultPage,
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      },
    });
    form.append('coreStyle', Buffer.from('body { color: yellow; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    form.append('sharedStyle', Buffer.from('body { color: blue; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}`, form);

    const coreStyle = await request.get(`/api/apps/${response.data.id}/style/core`);
    const sharedStyle = await request.get(`/api/apps/${response.data.id}/style/shared`);

    expect(response).toMatchObject({ status: 200 });
    expect(coreStyle).toMatchObject({ status: 200, data: 'body { color: yellow; }' });
    expect(sharedStyle).toMatchObject({ status: 200, data: 'body { color: blue; }' });
  });

  it('should not allow invalid core stylesheets when updating an app', async () => {
    const app = await App.create(
      {
        path: 'bar',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    const formA = createFormData({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        path: 'a',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      },
    });
    formA.append('coreStyle', Buffer.from('this is invalid css'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    authorizeStudio();
    const responseA = await request.patch(`/api/apps/${app.id}`, formA);

    const formB = createFormData({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        path: 'a',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      },
    });
    formB.append('coreStyle', Buffer.from('.foo { margin: 0 auto; }'), {
      contentType: 'application/json',
      filename: 'style.json',
    });
    authorizeStudio();
    const responseB = await request.patch(`/api/apps/${app.id}`, formB);

    expect(responseA.status).toBe(400);
    expect(responseB.status).toBe(400);
  });

  it('should not allow invalid shared stylesheets when updating an app', async () => {
    const app = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const formA = createFormData({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        path: 'a',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'testblock' }],
          },
        ],
      },
    });
    formA.append('sharedStyle', Buffer.from('this is invalid css'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    authorizeStudio();
    const responseA = await request.patch(`/api/apps/${app.id}`, formA);

    const formB = createFormData({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        path: 'a',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'testblock' }],
          },
        ],
      },
    });
    formB.append('sharedStyle', Buffer.from('.foo { margin: 0 auto; }'), {
      contentType: 'application/json',
      filename: 'style.json',
    });
    authorizeStudio();
    const responseB = await request.patch(`/api/apps/${app.id}`, formB);

    expect(responseA.status).toBe(400);
    expect(responseB.status).toBe(400);
  });
});

describe('setAppLock', () => {
  it('should set the locked property to true', async () => {
    authorizeStudio();
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const response = await request.post(`/api/apps/${app.id}/lock`, { locked: true });
    await app.reload();
    expect(response.status).toStrictEqual(204);
    expect(app.locked).toStrictEqual(true);
  });

  it('should set the locked property to false', async () => {
    authorizeStudio();
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      locked: true,
    });

    const response = await request.post(`/api/apps/${app.id}/lock`, { locked: false });
    await app.reload();
    expect(response.status).toStrictEqual(204);
    expect(app.locked).toStrictEqual(false);
  });

  it('should not be possible to set the lock status as an app editor', async () => {
    await Member.update({ role: 'AppEditor' }, { where: { UserId: user.id } });

    authorizeStudio();
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      locked: true,
    });

    const response = await request.post(`/api/apps/${app.id}/lock`, { locked: false });
    expect(response).toMatchObject({
      status: 403,
      data: { message: 'User does not have sufficient permissions.' },
    });
  });
});

describe('deleteApp', () => {
  it('should delete an app', async () => {
    authorizeStudio();
    const {
      data: { id },
    } = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [
                {
                  type: 'test',
                  version: '0.0.0',
                },
              ],
            },
          ],
        },
      }),
    );

    const response = await request.delete(`/api/apps/${id}`);

    expect(response).toMatchObject({
      status: 204,
      data: '',
    });
  });

  it('should not delete non-existent apps', async () => {
    authorizeStudio();
    const response = await request.delete('/api/apps/0');

    expect(response).toMatchObject({
      status: 404,
      data: {},
    });
  });

  it('should not delete apps from other organizations', async () => {
    const organizationB = await Organization.create({ id: 'testorganizationb' });
    const app = await App.create({
      path: 'test-app',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organizationB.id,
    });

    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}`);

    expect(response).toMatchObject({
      status: 403,
      data: {},
    });
  });
});

describe('getAppSnapshots', () => {
  it('should return a list of app snapshots', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    await AppSnapshot.create({
      AppId: app.id,
      UserId: user.id,
      yaml: "name: Test App\ndefaultPage: 'Test Page'",
    });
    clock.tick(60_000);
    await AppSnapshot.create({
      AppId: app.id,
      UserId: user.id,
      yaml: "name: Test App\ndefaultPage: 'Test Page'",
    });

    authorizeStudio(user);
    const response = await request.get(`/api/apps/${app.id}/snapshots`);

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: expect.any(Number),
          $created: '1970-01-01T00:01:00.000Z',
          $author: { name: user.name, id: user.id },
        },
        {
          id: expect.any(Number),
          $created: '1970-01-01T00:00:00.000Z',
          $author: { name: user.name, id: user.id },
        },
      ],
    });
  });
});

describe('getAppSnapshot', () => {
  it('should return an app snapshot', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const snapshot = await AppSnapshot.create({
      AppId: app.id,
      UserId: user.id,
      yaml: "name: Test App\ndefaultPage: 'Test Page 1'",
    });
    await AppSnapshot.create({
      AppId: app.id,
      UserId: user.id,
      yaml: "name: Test App\ndefaultPage: 'Test Page 2'",
    });

    authorizeStudio(user);
    const response = await request.get(`/api/apps/${app.id}/snapshots/${snapshot.id}`);

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: expect.any(Number),
        $created: '1970-01-01T00:00:00.000Z',
        $author: { name: user.name, id: user.id },
        yaml: snapshot.yaml,
      },
    });
  });

  it('should not return an snapshot for a snapshot that doesn’t exist', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    await AppSnapshot.create({
      AppId: app.id,
      UserId: user.id,
      yaml: "name: Test App\ndefaultPage: 'Test Page 1'",
    });

    authorizeStudio(user);
    const response = await request.get(`/api/apps/${app.id}/snapshots/1000`);

    expect(response).toMatchObject({
      status: 404,
      data: {
        message: 'Snapshot not found',
      },
    });
  });
});

describe('getAppIcon', () => {
  it('should serve the regular icon if requested', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.get(`/api/apps/${app.id}/icon`, { responseType: 'arraybuffer' });
    expect(response).toMatchObject({ status: 200, headers: { 'content-type': 'image/png' } });
    expect(response.data).toMatchImageSnapshot();
  });

  it('should generate a maskable icon from a horizontal app icon', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.get(`/api/apps/${app.id}/icon`, {
      params: { maskable: 'true' },
      responseType: 'arraybuffer',
    });
    expect(response).toMatchObject({ status: 200, headers: { 'content-type': 'image/png' } });
    expect(response.data).toMatchImageSnapshot();
  });

  it('should generate a maskable icon from a vertical app icon', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('10x50.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.get(`/api/apps/${app.id}/icon`, {
      params: { maskable: 'true' },
      responseType: 'arraybuffer',
    });
    expect(response).toMatchObject({ status: 200, headers: { 'content-type': 'image/png' } });
    expect(response.data).toMatchImageSnapshot();
  });

  it('should use the icon background color if one is specified', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('10x50.png'),
      iconBackground: '#00ffff',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.get(`/api/apps/${app.id}/icon`, {
      params: { maskable: 'true' },
      responseType: 'arraybuffer',
    });
    expect(response).toMatchObject({ status: 200, headers: { 'content-type': 'image/png' } });
    expect(response.data).toMatchImageSnapshot();
  });

  it('should crop and fill an maskable icon', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      maskableIcon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.get(`/api/apps/${app.id}/icon`, {
      params: { maskable: 'true' },
      responseType: 'arraybuffer',
    });
    expect(response).toMatchObject({ status: 200, headers: { 'content-type': 'image/png' } });
    expect(response.data).toMatchImageSnapshot();
  });
});

describe('deleteAppIcon', () => {
  it('should delete existing app icons', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/icon`);
    await app.reload();
    expect(response.status).toStrictEqual(204);
    expect(app.maskableIcon).toBeNull();
  });

  it('should not delete icons from non-existent apps', async () => {
    authorizeStudio();
    const response = await request.delete('/api/apps/0/icon');
    expect(response).toMatchObject({ status: 404, data: { message: 'App not found' } });
  });

  it('should not delete non-existent icons from apps', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/icon`);
    expect(response).toMatchObject({ status: 404, data: { message: 'App has no icon' } });
  });
});

describe('deleteAppMaskableIcon', () => {
  it('should delete existing app maskable icons', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      maskableIcon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/maskableIcon`);
    await app.reload();
    expect(response.status).toStrictEqual(204);
    expect(app.maskableIcon).toBeNull();
  });

  it('should not delete maskable icons from non-existent apps', async () => {
    authorizeStudio();
    const response = await request.delete('/api/apps/0/maskableIcon');
    expect(response).toMatchObject({ status: 404, data: { message: 'App not found' } });
  });

  it('should not delete non-existent maskable icons from apps', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/maskableIcon`);
    expect(response).toMatchObject({ status: 404, data: { message: 'App has no maskable icon' } });
  });
});

describe('getAppScreenshots', () => {
  it('should throw a 404 if the app doesn’t exist', async () => {
    const response = await request.get('/api/apps/1/screenshots/1');
    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', message: 'App not found', statusCode: 404 },
    });
  });

  it('should throw a 404 if the screenshot doesn’t exist', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const response = await request.get(`/api/apps/${app.id}/screenshots/1`);
    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', message: 'Screenshot not found', statusCode: 404 },
    });
  });

  it('should return the screenshot', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const buffer = await readFixture('standing.png');
    const screenshot = await AppScreenshot.create({
      AppId: app.id,
      screenshot: buffer,
    });
    const response = await request.get(`/api/apps/${app.id}/screenshots/${screenshot.id}`, {
      responseType: 'arraybuffer',
    });
    expect(response).toMatchObject({ status: 200, headers: { 'content-type': 'image/png' } });
    expect(response.data).toStrictEqual(buffer);
  });
});

describe('createAppScreenshot', () => {
  it('should create one screenshot', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const form = createFormData({
      screenshots: createFixtureStream('standing.png'),
    });

    authorizeStudio();
    const createdResponse = await request.post(`/api/apps/${app.id}/screenshots`, form);

    expect(createdResponse).toMatchObject({ status: 201, data: [expect.any(Number)] });
  });

  it('should create multiple screenshots', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const form = createFormData({
      screenshots: [createFixtureStream('standing.png'), createFixtureStream('standing.png')],
    });

    authorizeStudio();
    const createdResponse = await request.post(`/api/apps/${app.id}/screenshots`, form);

    expect(createdResponse).toMatchObject({
      status: 201,
      data: [expect.any(Number), expect.any(Number)],
    });
  });

  // XXX: Re-enable this test when updating Koas 🧀
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('should not accept empty arrays of screenshots', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const form = createFormData({});

    authorizeStudio();
    const createdResponse = await request.post(`/api/apps/${app.id}/screenshots`, form);

    expect(createdResponse.status).toBe(400);
  });

  it('should not accept files that aren’t images', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const form = createFormData({ screenshots: Buffer.from('I am not a screenshot') });

    authorizeStudio();
    const createdResponse = await request.post(`/api/apps/${app.id}/screenshots`, form);

    expect(createdResponse).toMatchObject({
      status: 400,
      data: { message: 'Invalid content types found' },
    });
  });
});

describe('deleteAppScreenshot', () => {
  it('should delete existing screenshots', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const buffer = await readFixture('standing.png');
    const screenshot = await AppScreenshot.create({
      AppId: app.id,
      screenshot: buffer,
    });

    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/screenshots/${screenshot.id}`);

    const screenshots = await AppScreenshot.count();

    expect(response.status).toBe(200);
    expect(screenshots).toStrictEqual(0);
  });

  it('should return 404 when trying to delete screenshots with IDs that don’t exist', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/screenshots/0`);

    expect(response.status).toBe(404);
  });
});

describe('setAppBlockStyle', () => {
  it('should validate and update css when updating an app’s block style', async () => {
    await BlockVersion.create({
      name: 'testblock',
      OrganizationId: 'appsemble',
      description: 'This is a test block for testing purposes.',
      version: '0.0.0',
    });

    const { id } = await App.create(
      {
        path: 'bar',
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [{ name: 'Test', blocks: { type: 'testblock', version: '0.0.0' } }],
        },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    const form = new FormData();
    form.append('style', Buffer.from('body { color: yellow; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    authorizeStudio();
    const response = await request.post(`/api/apps/${id}/style/block/@appsemble/testblock`, form);

    const style = await request.get(`/api/apps/${id}/style/block/@appsemble/testblock`);

    expect(response).toMatchObject({ status: 204 });
    expect(style).toMatchObject({ status: 200, data: 'body { color: yellow; }' });
  });

  it('should delete block stylesheet when uploading empty stylesheets for an app', async () => {
    await BlockVersion.create({
      name: 'testblock',
      OrganizationId: 'appsemble',
      description: 'This is a test block for testing purposes.',
      version: '0.0.0',
    });

    const { id } = await App.create(
      {
        path: 'bar',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    const formA = new FormData();
    formA.append('style', Buffer.from('body { color: blue; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    authorizeStudio();
    const responseA = await request.post(`/api/apps/${id}/style/block/@appsemble/testblock`, formA);
    expect(responseA).toMatchObject({
      status: 204,
      data: '',
    });

    const formB = new FormData();
    formB.append('style', Buffer.from(' '), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    authorizeStudio();
    const responseB = await request.post(`/api/apps/${id}/style/block/@appsemble/testblock`, formB);

    expect(responseB).toMatchObject({
      status: 204,
      data: '',
    });

    const style = await AppBlockStyle.findOne({
      where: { AppId: id, block: '@appsemble/testblock' },
    });
    expect(style).toBeNull();
  });

  it('should not update an app if it is currently locked', async () => {
    await BlockVersion.create({
      name: 'testblock',
      OrganizationId: 'appsemble',
      description: 'This is a test block for testing purposes.',
      version: '0.0.0',
    });

    const { id } = await App.create(
      {
        path: 'bar',
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [{ name: 'Test', blocks: { type: 'testblock', version: '0.0.0' } }],
        },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
        locked: true,
      },
      { raw: true },
    );

    const form = new FormData();
    form.append('style', Buffer.from('body { color: yellow; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });

    authorizeStudio();
    const response = await request.post(`/api/apps/${id}/style/block/@appsemble/testblock`, form);

    expect(response).toMatchObject({ status: 403, data: { message: 'App is currently locked.' } });
  });

  it('should not allow invalid stylesheets when uploading block stylesheets to an app', async () => {
    await BlockVersion.create({
      OrganizationId: 'appsemble',
      name: 'styledblock',
      description: 'This is a test block for testing purposes.',
      version: '0.0.0',
    });

    const { id } = await App.create({
      path: 'b',
      private: false,
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const form = new FormData();
    form.append('style', Buffer.from('invalidCss'));
    authorizeStudio();
    const response = await request.post(`/api/apps/${id}/style/block/@appsemble/styledblock`, form);

    expect(response).toMatchObject({
      status: 400,
      data: {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Provided CSS was invalid.',
      },
    });
  });

  it('should not allow uploading block stylesheets to non-existent apps', async () => {
    await BlockVersion.create({
      OrganizationId: 'appsemble',
      name: 'block',
      description: 'This is a test block for testing purposes.',
      version: '0.0.0',
    });

    const form = new FormData();
    form.append('style', Buffer.from('body { color: red; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    authorizeStudio();
    const response = await request.post('/api/apps/0/style/block/@appsemble/block', form);

    expect(response).toMatchObject({
      status: 404,
      data: {
        statusCode: 404,
        error: 'Not Found',
        message: 'App not found.',
      },
    });
  });

  it('should not allow uploading block stylesheets for non-existent blocks', async () => {
    const { id } = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const form = new FormData();
    form.append('style', Buffer.from('body { color: red; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    authorizeStudio();
    const response = await request.post(`/api/apps/${id}/style/block/@appsemble/doesntexist`, form);

    expect(response).toMatchObject({
      status: 404,
      data: {
        statusCode: 404,
        error: 'Not Found',
        message: 'Block not found.',
      },
    });
  });

  it('should return an empty response on non-existent block stylesheets', async () => {
    const { id } = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const response = await request.get(`/api/apps/${id}/style/block/@appsemble/doesntexist`);

    expect(response).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'text/css; charset=utf-8',
      }),
      data: '',
    });
  });

  it('should not allow to update an app using non-existent blocks', async () => {
    authorizeStudio();
    const { id } = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.patch(
      `/api/apps/${id}`,
      createFormData({
        'organization.id': organization.id,
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [
                {
                  type: '@non/existent',
                  version: '0.0.0',
                },
              ],
            },
          ],
        },
      }),
    );

    expect(response).toMatchObject({
      status: 400,
      data: {},
    });
  });

  it('should not allow to update an app using non-existent block versions', async () => {
    authorizeStudio();
    const { id } = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.patch(
      `/api/apps/${id}`,
      createFormData({
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [
                {
                  type: 'test',
                  version: '0.0.1',
                },
              ],
            },
          ],
        },
      }),
    );

    expect(response).toMatchObject({
      status: 400,
      data: {
        data: {
          'pages.0.blocks.0': 'Unknown block type “@appsemble/test”',
        },
        error: 'Bad Request',
        message: 'Appsemble definition is invalid.',
        statusCode: 400,
      },
    });
  });
});
