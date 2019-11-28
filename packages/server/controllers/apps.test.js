import { createInstance } from 'axios-test-instance';
import FormData from 'form-data';
import jwt from 'jsonwebtoken';
import lolex from 'lolex';

import createServer from '../utils/createServer';
import testSchema from '../utils/test/testSchema';
import testToken from '../utils/test/testToken';
import truncate from '../utils/test/truncate';

describe('app controller', () => {
  let App;
  let AppBlockStyle;
  let AppRating;
  let BlockDefinition;
  let BlockVersion;
  let Organization;
  let User;
  let db;
  let request;
  let server;
  let authorization;
  let organizationId;
  let userId;
  let clock;

  beforeAll(async () => {
    db = await testSchema('apps');

    server = await createServer({ db });
    ({
      App,
      AppBlockStyle,
      AppRating,
      BlockDefinition,
      BlockVersion,
      Organization,
      User,
    } = db.models);
    request = await createInstance(server);
  }, 10e3);

  beforeEach(async () => {
    clock = lolex.install();

    await truncate(db);
    authorization = await testToken(server, db, 'apps:read apps:write');
    const decodedToken = jwt.decode(authorization.substring(7));
    organizationId = decodedToken.user.organizations[0].id;
    userId = decodedToken.user.id;

    await BlockDefinition.create({
      id: '@appsemble/test',
    });
    await BlockVersion.create({
      name: '@appsemble/test',
      version: '0.0.0',
      parameters: {
        properties: {
          foo: {
            type: 'number',
          },
        },
      },
    });
  });

  afterEach(() => {
    clock.uninstall();
  });

  afterAll(async () => {
    await request.close();
    await db.close();
  });

  it('should return an empty array of apps', async () => {
    const response = await request.get('/api/apps', { headers: { authorization } });

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
        OrganizationId: organizationId,
      },
      { raw: true },
    );
    const appB = await App.create(
      {
        path: 'another-app',
        definition: { name: 'Another App', defaultPage: 'Another Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organizationId,
      },
      { raw: true },
    );

    const response = await request.get('/api/apps');

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: appA.id,
          $created: new Date(clock.now).toJSON(),
          $updated: new Date(clock.now).toJSON(),
          domain: null,
          private: false,
          path: 'test-app',
          iconUrl: `/api/apps/${appA.id}/icon`,
          definition: appA.definition,
          OrganizationId: appA.OrganizationId,
        },
        {
          id: appB.id,
          $created: new Date(clock.now).toJSON(),
          $updated: new Date(clock.now).toJSON(),
          domain: null,
          private: false,
          path: 'another-app',
          iconUrl: `/api/apps/${appB.id}/icon`,
          definition: appB.definition,
          OrganizationId: appB.OrganizationId,
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
        OrganizationId: organizationId,
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
        OrganizationId: organizationId,
      },
      { raw: true },
    );

    const response = await request.get('/api/apps');
    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: appA.id,
          $created: new Date(clock.now).toJSON(),
          $updated: new Date(clock.now).toJSON(),
          domain: null,
          private: false,
          path: 'test-app',
          iconUrl: `/api/apps/${appA.id}/icon`,
          definition: appA.definition,
          OrganizationId: appA.OrganizationId,
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
      OrganizationId: organizationId,
    });
    await AppRating.create({
      AppId: appA.id,
      UserId: userId,
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
      OrganizationId: organizationId,
    });

    const appC = await await App.create({
      path: 'yet-another-app',
      definition: { name: 'Another App', defaultPage: 'Another Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organizationId,
    });
    await AppRating.create({
      AppId: appC.id,
      UserId: userId,
      rating: 3,
      description: 'This is a test rating',
    });

    const response = await request.get('/api/apps');

    expect(response).toMatchObject({
      status: 200,
      data: [
        expect.objectContaining({ id: appA.id, rating: { count: 2, average: 4.5 } }),
        expect.objectContaining({ id: appC.id, rating: { count: 1, average: 3 } }),
        expect.objectContaining({ id: appB.id, rating: { count: 0, average: null } }),
      ],
    });
  });

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
        OrganizationId: organizationId,
      },
      { raw: true },
    );
    const response = await request.get(`/api/apps/${appA.id}`);

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: appA.id,
        $created: new Date(clock.now).toJSON(),
        $updated: new Date(clock.now).toJSON(),
        domain: null,
        private: false,
        path: 'test-app',
        iconUrl: `/api/apps/${appA.id}/icon`,
        definition: appA.definition,
        OrganizationId: organizationId,
        yaml: `name: Test App
defaultPage: Test Page
`,
      },
    });
  });

  it('should be able to fetch filtered apps', async () => {
    const appA = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organizationId,
      },
      { raw: true },
    );

    const organizationB = await Organization.create({ id: 'testorganizationb' });
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

    const responseA = await request.get('/api/apps/me', { headers: { authorization } });

    const users = await User.findAll();
    await users[0].addOrganization(organizationB);

    const responseB = await request.get('/api/apps/me', { headers: { authorization } });

    expect(responseA).toMatchObject({
      status: 200,
      data: [
        {
          id: appA.id,
          $created: new Date(clock.now).toJSON(),
          $updated: new Date(clock.now).toJSON(),
          domain: null,
          private: false,
          path: 'test-app',
          iconUrl: `/api/apps/${appA.id}/icon`,
          definition: appA.definition,
          OrganizationId: appA.OrganizationId,
        },
      ],
    });
    expect(responseB).toMatchObject({
      status: 200,
      data: [
        {
          id: appA.id,
          $created: new Date(clock.now).toJSON(),
          $updated: new Date(clock.now).toJSON(),
          domain: null,
          private: false,
          path: 'test-app',
          iconUrl: `/api/apps/${appA.id}/icon`,
          definition: appA.definition,
          OrganizationId: appA.OrganizationId,
        },
        {
          id: appB.id,
          $created: new Date(clock.now).toJSON(),
          $updated: new Date(clock.now).toJSON(),
          domain: null,
          private: false,
          path: 'test-app-b',
          iconUrl: `/api/apps/${appB.id}/icon`,
          definition: appB.definition,
          OrganizationId: appB.OrganizationId,
        },
      ],
    });
  });

  it('should create an app', async () => {
    const form = new FormData();
    form.append('OrganizationId', organizationId);
    form.append(
      'definition',
      JSON.stringify({
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
      }),
    );
    const createdResponse = await request.post('/api/apps', form, {
      headers: { ...form.getHeaders(), authorization },
    });

    expect(createdResponse).toMatchObject({
      status: 201,
      data: {
        id: expect.any(Number),
        $created: new Date(clock.now).toJSON(),
        $updated: new Date(clock.now).toJSON(),
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
        OrganizationId: organizationId,
        yaml: `name: Test App
defaultPage: Test Page
pages:
  - name: Test Page
    blocks:
      - type: test
        version: 0.0.0
`,
      },
    });
    const { data: retrieved } = await request.get(`/api/apps/${createdResponse.data.id}`);
    expect(retrieved).toStrictEqual({
      ...createdResponse.data,
      rating: {
        average: null,
        count: 0,
      },
    });
  });

  it('should not allow an upload without an app when creating an app', async () => {
    const form = new FormData();
    form.append('style', Buffer.from('body { color: red; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    const response = await request.post('/api/apps', form, {
      headers: { ...form.getHeaders(), authorization },
    });

    expect(response).toMatchObject({
      status: 400,
      data: {},
    });
  });

  it('should not allow apps to be created without an organizationId', async () => {
    const form = new FormData();
    form.append(
      'definition',
      JSON.stringify({
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
      }),
    );
    const response = await request.post('/api/apps', form, {
      headers: { ...form.getHeaders(), authorization },
    });

    expect(response).toMatchObject({
      status: 400,
      data: {
        errors: [
          {
            code: 'OBJECT_MISSING_REQUIRED_PROPERTY',
            message: 'Missing required property: OrganizationId',
            params: ['OrganizationId'],
            path: [],
          },
        ],
        message: 'JSON schema validation failed',
      },
    });
  });

  it('should not allow apps to be created for organizations the user does not belong to', async () => {
    const form = new FormData();
    form.append('OrganizationId', 'a');
    form.append(
      'definition',
      JSON.stringify({
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
      }),
    );
    const response = await request.post('/api/apps', form, {
      headers: { ...form.getHeaders(), authorization },
    });

    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'User does not belong in this organization.',
        statusCode: 403,
      },
    });
  });

  it('should not allow to create an app using non-existent blocks', async () => {
    const form = new FormData();
    form.append('OrganizationId', organizationId);
    form.append(
      'definition',
      JSON.stringify({
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
      }),
    );
    const response = await request.post('/api/apps', form, {
      headers: { ...form.getHeaders(), authorization },
    });

    expect(response).toMatchObject({
      status: 400,
      data: {
        data: {
          'pages.0.blocks.0': 'Unknown block type “@non/existent”',
        },
        error: 'Bad Request',
        message: 'Block validation failed',
        statusCode: 400,
      },
    });
  });

  it('should not allow to create an app using non-existent block versions', async () => {
    const form = new FormData();
    form.append('OrganizationId', organizationId);
    form.append(
      'definition',
      JSON.stringify({
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
      }),
    );
    const response = await request.post('/api/apps', form, {
      headers: { ...form.getHeaders(), authorization },
    });

    expect(response).toMatchObject({
      status: 400,
      data: {
        data: {
          'pages.0.blocks.0': 'Unknown block type “@appsemble/test”',
        },
        error: 'Bad Request',
        message: 'Block validation failed',
        statusCode: 400,
      },
    });
  });

  it('should not allow to create an app using invalid block parameters', async () => {
    const form = new FormData();
    form.append('OrganizationId', organizationId);
    form.append(
      'definition',
      JSON.stringify({
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
      }),
    );
    const response = await request.post('/api/apps', form, {
      headers: { ...form.getHeaders(), authorization },
    });

    expect(response).toMatchObject({
      status: 400,
      data: {
        data: {
          'pages.0.blocks.0.parameters.foo': {
            dataPath: '.foo',
            keyword: 'type',
            message: 'should be number',
            params: {
              type: 'number',
            },
            schemaPath: '#/properties/foo/type',
          },
        },
        error: 'Bad Request',
        message: 'Block validation failed',
        statusCode: 400,
      },
    });
  });

  it('should handle app path conflicts on create', async () => {
    const formA = new FormData();
    formA.append('OrganizationId', organizationId);
    formA.append(
      'definition',
      JSON.stringify({
        name: 'Test App',
        defaultPage: 'Test Page',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      }),
    );
    await request.post('/api/apps', formA, { headers: { ...formA.getHeaders(), authorization } });

    const formB = new FormData();
    formB.append('OrganizationId', organizationId);
    formB.append(
      'definition',
      JSON.stringify({
        name: 'Test App',
        defaultPage: 'Test Page',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      }),
    );
    const response = await request.post('/api/apps', formB, {
      headers: { ...formB.getHeaders(), authorization },
    });

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
      Array.from(new Array(11), (_, index) => ({
        path: index ? `test-app-${index}` : 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: `a${index}`,
        vapidPrivateKey: `b${index}`,
        OrganizationId: organizationId,
      })),
      { raw: true },
    );

    const form = new FormData();
    form.append('OrganizationId', organizationId);
    form.append(
      'definition',
      JSON.stringify({
        name: 'Test App',
        defaultPage: 'Test Page',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      }),
    );
    const response = await request.post('/api/apps', form, {
      headers: { ...form.getHeaders(), authorization },
    });

    expect(response).toMatchObject({
      status: 201,
      data: expect.objectContaining({
        path: expect.stringMatching(/test-app-(\w){10}/),
      }),
    });
  });

  it('should allow stylesheets to be included when creating an app', async () => {
    const form = new FormData();
    form.append('OrganizationId', organizationId);
    form.append(
      'definition',
      JSON.stringify({
        name: 'Foobar',
        defaultPage: 'Test Page',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      }),
    );
    form.append('style', Buffer.from('body { color: blue; }'), {
      contentType: 'text/css',
      filename: 'test.css',
    });
    form.append('sharedStyle', Buffer.from(':root { --primary-color: purple; }'), {
      contentType: 'text/css',
      filename: 'test.css',
    });
    const response = await request.post('/api/apps', form, {
      headers: { ...form.getHeaders(), authorization },
    });

    const style = await request.get(`/api/apps/${response.data.id}/style/core`);
    const sharedStyle = await request.get(`/api/apps/${response.data.id}/style/shared`);

    expect(response).toMatchObject({ status: 201 });
    expect(style).toMatchObject({ status: 200, data: 'body { color: blue; }' });
    expect(sharedStyle).toMatchObject({ status: 200, data: ':root { --primary-color: purple; }' });
  });

  it('should not allow invalid core stylesheets when creating an app', async () => {
    const form = new FormData();
    form.append('OrganizationId', organizationId);
    form.append(
      'definition',
      JSON.stringify({
        name: 'Test App',
        defaultPage: 'Test Page',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      }),
    );
    form.append('style', Buffer.from('this is invalid css'), {
      contentType: 'text/css',
      filename: 'test.css',
    });
    const response = await request.post('/api/apps', form, {
      headers: { ...form.getHeaders(), authorization },
    });

    expect(response.status).toBe(400);
  });

  it('should not allow invalid shared stylesheets when creating an app', async () => {
    const form = new FormData();
    form.append('OrganizationId', organizationId);
    form.append(
      'definition',
      JSON.stringify({
        name: 'Test App',
        defaultPage: 'Test Page',
        path: 'a',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'testblock' }],
          },
        ],
      }),
    );
    form.append('sharedStyle', Buffer.from('this is invalid css'), {
      contentType: 'text/css',
      filename: 'test.css',
    });
    const response = await request.post('/api/apps', form, {
      headers: { ...form.getHeaders(), authorization },
    });

    expect(response).toMatchObject({
      status: 400,
      data: {},
    });
  });

  it('should not update a non-existent app', async () => {
    const form = new FormData();
    form.append(
      'definition',
      JSON.stringify({
        name: 'Foobar',
        defaultPage: 'Test Page',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      }),
    );
    const response = await request.patch('/api/apps/1', form, {
      headers: { ...form.getHeaders(), authorization },
    });

    expect(response).toMatchObject({
      status: 404,
      data: {
        message: 'App not found',
      },
    });
  });

  it('should update an app', async () => {
    const appA = await App.create(
      {
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        path: 'test-app',
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organizationId,
      },
      { raw: true },
    );

    const form = new FormData();
    form.append('private', 'true');
    form.append(
      'definition',
      JSON.stringify({
        name: 'Foobar',
        defaultPage: appA.definition.defaultPage,
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      }),
    );
    const response = await request.patch(`/api/apps/${appA.id}`, form, {
      headers: { ...form.getHeaders(), authorization },
    });

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: appA.id,
        $created: new Date(clock.now).toJSON(),
        $updated: new Date(clock.now).toJSON(),
        domain: null,
        private: true,
        path: 'test-app',
        iconUrl: `/api/apps/${appA.id}/icon`,
        OrganizationId: organizationId,
        definition: {
          name: 'Foobar',
          defaultPage: appA.definition.defaultPage,
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

  it('should verify the YAML on validity when updating an app', async () => {
    const appA = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organizationId,
      },
      { raw: true },
    );

    const form = new FormData();
    form.append(
      'definition',
      JSON.stringify({
        name: 'Foobar',
        defaultPage: appA.definition.defaultPage,
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      }),
    );
    form.append(
      'yaml',
      Buffer.from(`name; Foobar
defaultPage: Test Page
pages:
- name: Test Page
  blocks:
    - type: test
      version: 0.0.0
`),
    );
    const response = await request.patch(`/api/apps/${appA.id}`, form, {
      headers: { ...form.getHeaders(), authorization },
    });

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
    const appA = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organizationId,
      },
      { raw: true },
    );

    const form = new FormData();
    form.append(
      'definition',
      JSON.stringify({
        name: 'Foobar',
        defaultPage: appA.definition.defaultPage,
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      }),
    );
    form.append(
      'yaml',
      Buffer.from(`name: Barfoo
defaultPage: Test Page
pages:
- name: Test page
  blocks:
    - type: test
      version: 0.0.0
`),
    );
    const response = await request.patch(`/api/apps/${appA.id}`, form, {
      headers: { ...form.getHeaders(), authorization },
    });

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
    const appA = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organizationId,
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

    const form = new FormData();
    form.append('yaml', Buffer.from(yaml));
    form.append(
      'definition',
      JSON.stringify({
        name: 'Foobar',
        defaultPage: appA.definition.defaultPage,
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      }),
    );
    const response = await request.patch(`/api/apps/${appA.id}`, form, {
      headers: { ...form.getHeaders(), authorization },
    });

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: appA.id,
        $created: new Date(clock.now).toJSON(),
        $updated: new Date(clock.now).toJSON(),
        domain: null,
        private: false,
        path: 'test-app',
        iconUrl: `/api/apps/${appA.id}/icon`,
        OrganizationId: organizationId,
        definition: {
          name: 'Foobar',
          defaultPage: appA.definition.defaultPage,
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
    const appA = await App.create(
      {
        path: 'foo',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organizationId,
      },
      { raw: true },
    );

    const form = new FormData();
    form.append('domain', 'appsemble.app');
    const response = await request.patch(`/api/apps/${appA.id}`, form, {
      headers: { ...form.getHeaders(), authorization },
    });

    expect(response).toMatchObject({
      status: 200,
      data: expect.objectContaining({
        domain: 'appsemble.app',
      }),
    });
  });

  it('should set the app domain to null', async () => {
    const appA = await App.create(
      {
        path: 'foo',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organizationId,
      },
      { raw: true },
    );

    const form = new FormData();
    form.append('domain', '');
    const response = await request.patch(`/api/apps/${appA.id}`, form, {
      headers: { ...form.getHeaders(), authorization },
    });

    expect(response).toMatchObject({
      status: 200,
      data: expect.objectContaining({
        domain: null,
      }),
    });
  });

  it('should save formatted YAML when updating an app', async () => {
    const appA = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organizationId,
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

    const form = new FormData();
    form.append(
      'definition',
      JSON.stringify({
        name: 'Foobar',
        defaultPage: appA.definition.defaultPage,
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      }),
    );
    form.append('yaml', buffer);
    const response = await request.patch(`/api/apps/${appA.id}`, form, {
      headers: { ...form.getHeaders(), authorization },
    });

    const responseBuffer = Buffer.from(response.data.yaml);
    expect(responseBuffer).toStrictEqual(buffer);
  });

  it('should not update an app of another organization', async () => {
    const newOrganization = await Organization.create({ id: 'Test Organization 2' });
    const appA = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: newOrganization.id,
      },
      { raw: true },
    );

    const form = new FormData();
    form.append(
      'definition',
      JSON.stringify({
        name: 'Foobar',
        defaultPage: appA.definition.defaultPage,
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      }),
    );
    const response = await request.patch(`/api/apps/${appA.id}`, form, {
      headers: { ...form.getHeaders(), authorization },
    });

    expect(response).toMatchObject({
      status: 403,
      data: {
        statusCode: 403,
        error: 'Forbidden',
        message: "User does not belong in this App's organization.",
      },
    });
  });

  it('should validate an app on creation', async () => {
    const form = new FormData();
    form.append('app', JSON.stringify({ foo: 'bar' }));
    const response = await request.post('/api/apps', form, {
      headers: { ...form.getHeaders(), authorization },
    });

    expect(response).toMatchObject({
      status: 400,
      data: {},
    });
  });

  it('should validate an app on update', async () => {
    const appA = await App.create(
      {
        path: 'foo',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organizationId,
      },
      { raw: true },
    );

    const form = new FormData();
    form.append('definition', JSON.stringify({ name: 'Foobar' }));
    const response = await request.patch(`/api/apps/${appA.id}`, form, {
      headers: { ...form.getHeaders(), authorization },
    });

    expect(response).toMatchObject({
      status: 400,
      data: {},
    });
  });

  it('should delete an app', async () => {
    const form = new FormData();
    form.append('OrganizationId', organizationId);
    form.append(
      'definition',
      JSON.stringify({
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
      }),
    );
    const {
      data: { id },
    } = await request.post('/api/apps', form, {
      headers: { ...form.getHeaders(), authorization },
    });

    const response = await request.delete(`/api/apps/${id}`, {
      headers: { authorization },
    });

    expect(response).toMatchObject({ status: 204 });
  });

  it('should not delete non-existent apps', async () => {
    const response = await request.delete('/api/apps/0', { headers: { authorization } });

    expect(response).toMatchObject({
      status: 404,
      data: {},
    });
  });

  it('should not delete apps from other organizations', async () => {
    const organization = await Organization.create({ id: 'testorganizationb' });
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

    const response = await request.delete(`/api/apps/${app.id}`, { headers: { authorization } });

    expect(response).toMatchObject({
      status: 403,
      data: {},
    });
  });

  it('should validate and update css when updating an app', async () => {
    const app = await App.create(
      {
        path: 'bar',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organizationId,
      },
      { raw: true },
    );

    const form = new FormData();
    form.append(
      'definition',
      JSON.stringify({
        name: 'Foobar',
        defaultPage: app.definition.defaultPage,
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      }),
    );
    form.append('style', Buffer.from('body { color: yellow; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    form.append('sharedStyle', Buffer.from('body { color: blue; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    const response = await request.patch(`/api/apps/${app.id}`, form, {
      headers: { ...form.getHeaders(), authorization },
    });

    const style = await request.get(`/api/apps/${response.data.id}/style/core`);
    const sharedStyle = await request.get(`/api/apps/${response.data.id}/style/shared`);

    expect(response).toMatchObject({ status: 200 });
    expect(style).toMatchObject({ status: 200, data: 'body { color: yellow; }' });
    expect(sharedStyle).toMatchObject({ status: 200, data: 'body { color: blue; }' });
  });

  it('should not allow invalid core stylesheets when updating an app', async () => {
    const app = await App.create(
      {
        path: 'bar',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organizationId,
      },
      { raw: true },
    );

    const formA = new FormData();

    formA.append(
      'definition',
      JSON.stringify({
        name: 'Test App',
        defaultPage: 'Test Page',
        path: 'a',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      }),
    );
    formA.append('style', Buffer.from('this is invalid css'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    const responseA = await request.patch(`/api/apps/${app.id}`, formA, {
      headers: { ...formA.getHeaders(), authorization },
    });

    const formB = new FormData();
    formB.append(
      'definition',
      JSON.stringify({
        name: 'Test App',
        defaultPage: 'Test Page',
        path: 'a',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      }),
    );
    formB.append('style', Buffer.from('.foo { margin: 0 auto; }'), {
      contentType: 'application/json',
      filename: 'style.json',
    });
    const responseB = await request.patch(`/api/apps/${app.id}`, formB, {
      headers: { ...formB.getHeaders(), authorization },
    });

    expect(responseA.status).toBe(400);
    expect(responseB.status).toBe(400);
  });

  it('should not allow invalid shared stylesheets when updating an app', async () => {
    const app = await App.create(
      {
        path: 'bar',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organizationId,
      },
      { raw: true },
    );

    const formA = new FormData();
    formA.append(
      'definition',
      JSON.stringify({
        name: 'Test App',
        defaultPage: 'Test Page',
        path: 'a',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'testblock' }],
          },
        ],
      }),
    );
    formA.append('sharedStyle', Buffer.from('this is invalid css'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    const responseA = await request.patch(`/api/apps/${app.id}`, formA, {
      headers: { ...formA.getHeaders(), authorization },
    });

    const formB = new FormData();
    formB.append(
      'definition',
      JSON.stringify({
        name: 'Test App',
        defaultPage: 'Test Page',
        path: 'a',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'testblock' }],
          },
        ],
      }),
    );
    formB.append('sharedStyle', Buffer.from('.foo { margin: 0 auto; }'), {
      contentType: 'application/json',
      filename: 'style.json',
    });
    const responseB = await request.patch(`/api/apps/${app.id}`, formB, {
      headers: { ...formB.getHeaders(), authorization },
    });

    expect(responseA.status).toBe(400);
    expect(responseB.status).toBe(400);
  });

  it('should delete block stylesheet when uploading empty stylesheets for an app', async () => {
    await BlockDefinition.create({
      id: '@appsemble/testblock',
      description: 'This is a test block for testing purposes.',
    });

    const { id } = await App.create(
      {
        path: 'bar',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organizationId,
      },
      { raw: true },
    );

    const formA = new FormData();
    formA.append('style', Buffer.from('body { color: blue; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    const responseA = await request.post(
      `/api/apps/${id}/style/block/@appsemble/testblock`,
      formA,
      { headers: { ...formA.getHeaders(), authorization } },
    );

    const formB = new FormData();
    formB.append('style', Buffer.from(' '), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    const responseB = await request.post(
      `/api/apps/${id}/style/block/@appsemble/testblock`,
      formB,
      { headers: { ...formB.getHeaders(), authorization } },
    );

    const style = await AppBlockStyle.findOne({
      where: { AppId: id, BlockDefinitionId: '@appsemble/testblock' },
    });

    expect(responseA.status).toBe(204);
    expect(responseB.status).toBe(204);
    expect(style).toBeNull();
  });

  it('should not allow invalid stylesheets when uploading block stylesheets to an app', async () => {
    await BlockDefinition.create({
      id: '@appsemble/styledblock',
      description: 'This is a test block for testing purposes.',
    });

    const { id } = await App.create({
      path: 'b',
      private: false,
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organizationId,
    });

    const form = new FormData();
    form.append('style', Buffer.from('invalidCss'));
    const response = await request.post(
      `/api/apps/${id}/style/block/@appsemble/styledblock`,
      form,
      { headers: { ...form.getHeaders(), authorization } },
    );

    expect(response).toMatchObject({
      status: 400,
      data: {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Provided CSS was invalid.',
      },
    });
  });

  it('should not allow uploading block stylesheets to non-existant apps', async () => {
    await BlockDefinition.create({
      id: '@appsemble/block',
      description: 'This is a test block for testing purposes.',
    });

    const form = new FormData();
    form.append('style', Buffer.from('body { color: red; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    const response = await request.post('/api/apps/0/style/block/@appsemble/block', form, {
      headers: { ...form.getHeaders(), authorization },
    });

    expect(response).toMatchObject({
      status: 404,
      data: {
        statusCode: 404,
        error: 'Not Found',
        message: 'App not found.',
      },
    });
  });

  it('should not allow uploading block stylesheets for non-existant blocks', async () => {
    const { id } = await App.create(
      {
        path: 'bar',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organizationId,
      },
      { raw: true },
    );

    const form = new FormData();
    form.append('style', Buffer.from('body { color: red; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    const response = await request.post(
      `/api/apps/${id}/style/block/@appsemble/doesntexist`,
      form,
      {
        headers: { ...form.getHeaders(), authorization },
      },
    );

    expect(response).toMatchObject({
      status: 404,
      data: {
        statusCode: 404,
        error: 'Not Found',
        message: 'Block not found.',
      },
    });
  });

  it('should return an empty response on non-existant block stylesheets', async () => {
    const { id } = await App.create(
      {
        path: 'bar',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organizationId,
      },
      { raw: true },
    );

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
    const form = new FormData();
    form.append('organizationId', organizationId);
    form.append(
      'definition',
      JSON.stringify({
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
      }),
    );

    const response = await request.patch('/api/apps/1', form, {
      headers: { ...form.getHeaders(), authorization },
    });

    expect(response).toMatchObject({
      status: 400,
      data: {},
    });
  });

  it('should not allow to update an app using non-existent block versions', async () => {
    const form = new FormData();
    form.append(
      'definition',
      JSON.stringify({
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
      }),
    );
    const response = await request.patch('/api/apps/1', form, {
      headers: { ...form.getHeaders(), authorization },
    });

    expect(response).toMatchObject({
      status: 400,
      data: {
        data: {
          'pages.0.blocks.0': 'Unknown block type “@appsemble/test”',
        },
        error: 'Bad Request',
        message: 'Block validation failed',
        statusCode: 400,
      },
    });
  });
});
