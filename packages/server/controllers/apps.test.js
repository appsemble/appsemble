import jwt from 'jsonwebtoken';
import lolex from 'lolex';
import request from 'supertest';

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
  let server;
  let token;
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
  }, 10e3);

  beforeEach(async () => {
    clock = lolex.install();

    await truncate(db);
    token = await testToken(request, server, db, 'apps:read apps:write');
    const decodedToken = jwt.decode(token.substring(7));
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
    await db.close();
  });

  it('should return an empty array of apps', async () => {
    const { body } = await request(server)
      .get('/api/apps')
      .set('Authorization', token);

    expect(body).toHaveLength(0);
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

    const { body } = await request(server).get('/api/apps');

    expect(body).toHaveLength(2);
    expect(body).toContainEqual({
      id: appA.id,
      $created: new Date(clock.now).toJSON(),
      $updated: new Date(clock.now).toJSON(),
      domain: null,
      private: false,
      path: 'test-app',
      iconUrl: `/api/apps/${appA.id}/icon`,
      definition: appA.definition,
      rating: {
        average: null,
        count: 0,
      },
      OrganizationId: appA.OrganizationId,
    });
    expect(body).toContainEqual({
      id: appB.id,
      $created: new Date(clock.now).toJSON(),
      $updated: new Date(clock.now).toJSON(),
      domain: null,
      private: false,
      path: 'another-app',
      iconUrl: `/api/apps/${appB.id}/icon`,
      definition: appB.definition,
      rating: {
        average: null,
        count: 0,
      },
      OrganizationId: appB.OrganizationId,
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

    const { body } = await request(server).get('/api/apps');
    expect(body).toHaveLength(1);
    expect(body).toContainEqual({
      id: appA.id,
      $created: new Date(clock.now).toJSON(),
      $updated: new Date(clock.now).toJSON(),
      domain: null,
      private: false,
      path: 'test-app',
      iconUrl: `/api/apps/${appA.id}/icon`,
      definition: appA.definition,
      rating: {
        average: null,
        count: 0,
      },
      OrganizationId: appA.OrganizationId,
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

    const { body } = await request(server).get('/api/apps');

    expect(body).toHaveLength(3);
    expect(body[0].id).toStrictEqual(appA.id);
    expect(body[0].rating).toStrictEqual({ count: 2, average: 4.5 });
    expect(body[1].id).toStrictEqual(appC.id);
    expect(body[1].rating).toStrictEqual({ count: 1, average: 3 });
    expect(body[2].id).toStrictEqual(appB.id);
    expect(body[2].rating).toStrictEqual({ count: 0, average: null });
  });

  it('should return 404 when fetching a non-existent app', async () => {
    const response = await request(server).get('/api/apps/1');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('App not found');
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
    const { body } = await request(server).get(`/api/apps/${appA.id}`);
    expect(body).toStrictEqual({
      id: appA.id,
      $created: new Date(clock.now).toJSON(),
      $updated: new Date(clock.now).toJSON(),
      domain: null,
      private: false,
      path: 'test-app',
      iconUrl: `/api/apps/${appA.id}/icon`,
      definition: appA.definition,
      OrganizationId: organizationId,
      rating: {
        average: null,
        count: 0,
      },
      yaml: `name: Test App
defaultPage: Test Page
`,
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

    const requestA = await request(server)
      .get('/api/apps/me')
      .set('Authorization', token);

    const users = await User.findAll();
    await users[0].addOrganization(organizationB);

    const requestB = await request(server)
      .get('/api/apps/me')
      .set('Authorization', token);

    expect(requestA.body).toStrictEqual([
      {
        id: appA.id,
        $created: new Date(clock.now).toJSON(),
        $updated: new Date(clock.now).toJSON(),
        domain: null,
        private: false,
        path: 'test-app',
        iconUrl: `/api/apps/${appA.id}/icon`,
        definition: appA.definition,
        rating: {
          average: null,
          count: 0,
        },
        OrganizationId: appA.OrganizationId,
      },
    ]);
    expect(requestB.body).toStrictEqual([
      {
        id: appA.id,
        $created: new Date(clock.now).toJSON(),
        $updated: new Date(clock.now).toJSON(),
        domain: null,
        private: false,
        path: 'test-app',
        iconUrl: `/api/apps/${appA.id}/icon`,
        definition: appA.definition,
        rating: {
          average: null,
          count: 0,
        },
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
        rating: {
          average: null,
          count: 0,
        },
        OrganizationId: appB.OrganizationId,
      },
    ]);
  });

  it('should create an app', async () => {
    const { body: created } = await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field('OrganizationId', organizationId)
      .field(
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

    expect(created).toStrictEqual({
      id: created.id,
      $created: new Date(clock.now).toJSON(),
      $updated: new Date(clock.now).toJSON(),
      domain: null,
      private: true,
      path: 'test-app',
      iconUrl: `/api/apps/${created.id}/icon`,
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
    });
    const { body: retrieved } = await request(server).get(`/api/apps/${created.id}`);
    expect(retrieved).toStrictEqual({
      ...created,
      OrganizationId: organizationId,
      rating: { average: null, count: 0 },
    });
  });

  it('should not allow an upload without an app when creating an app', async () => {
    const response = await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .attach('style', Buffer.from('body { color: red; }'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    expect(response.status).toBe(400);
  });

  it('should not allow apps to be created without an organizationId', async () => {
    const { body } = await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field(
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

    expect(body).toStrictEqual({
      errors: [
        {
          code: 'OBJECT_MISSING_REQUIRED_PROPERTY',
          message: 'Missing required property: OrganizationId',
          params: ['OrganizationId'],
          path: [],
        },
      ],
      message: 'JSON schema validation failed',
    });
  });

  it('should not allow apps to be created for organizations the user does not belong to', async () => {
    const { body } = await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field('OrganizationId', 'a')
      .field(
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

    expect(body).toStrictEqual({
      error: 'Forbidden',
      message: 'User does not belong in this organization.',
      statusCode: 403,
    });
  });

  it('should not allow to create an app using non-existent blocks', async () => {
    const { body } = await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field('OrganizationId', organizationId)
      .field(
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

    expect(body).toStrictEqual({
      data: {
        'pages.0.blocks.0': 'Unknown block type “@non/existent”',
      },
      error: 'Bad Request',
      message: 'Block validation failed',
      statusCode: 400,
    });
  });

  it('should not allow to create an app using non-existent block versions', async () => {
    const { body } = await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field('OrganizationId', organizationId)
      .field(
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

    expect(body).toStrictEqual({
      data: {
        'pages.0.blocks.0': 'Unknown block type “@appsemble/test”',
      },
      error: 'Bad Request',
      message: 'Block validation failed',
      statusCode: 400,
    });
  });

  it('should not allow to create an app using invalid block parameters', async () => {
    const { body } = await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field('OrganizationId', organizationId)
      .field(
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

    expect(body).toStrictEqual({
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
    });
  });

  it('should handle app path conflicts on create', async () => {
    await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field('OrganizationId', organizationId)
      .field(
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
    const response = await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field('OrganizationId', organizationId)
      .field(
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

    expect(response.status).toBe(201);
    expect(response.body.path).toStrictEqual('test-app-2');
  });

  it('should fall back to append random bytes to the end of the app path after 10 attempts', async () => {
    await Promise.all(
      [...new Array(11)].map((_, index) =>
        App.create(
          {
            path: index + 1 === 1 ? 'test-app' : `test-app-${index + 1}`,
            definition: { name: 'Test App', defaultPage: 'Test Page' },
            vapidPublicKey: `a${index}`,
            vapidPrivateKey: `b${index}`,
            OrganizationId: organizationId,
          },
          { raw: true },
        ),
      ),
    );

    const response = await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field('OrganizationId', organizationId)
      .field(
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

    expect(response.status).toStrictEqual(201);
    expect(response.body.path).toMatch(/test-app-(\w){10}/);
  });

  it('should fetch app ratings', async () => {
    const app = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organizationId,
      },
      { raw: true },
    );

    const userB = await User.create();
    await AppRating.create({
      AppId: app.id,
      UserId: userId,
      rating: 5,
      description: 'This app is great!',
    });
    await AppRating.create({
      AppId: app.id,
      UserId: userB.id,
      rating: 2,
      description: 'This app is so-so..',
    });

    const response = await request(server).get(`/api/apps/${app.id}/ratings`);
    expect(response).toMatchObject({
      status: 200,
      body: [
        {
          UserId: userId,
          name: 'Test User',
          rating: 5,
          description: 'This app is great!',
          $created: new Date(clock.now).toJSON(),
          $updated: new Date(clock.now).toJSON(),
        },
        {
          UserId: userB.id,
          name: null,
          rating: 2,
          description: 'This app is so-so..',
          $created: new Date(clock.now).toJSON(),
          $updated: new Date(clock.now).toJSON(),
        },
      ],
    });
  });

  it('should rate an app', async () => {
    const app = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organizationId,
      },
      { raw: true },
    );

    const response = await request(server)
      .post(`/api/apps/${app.id}/ratings`)
      .set('Authorization', token)
      .send({ rating: 5, description: 'This app is great!' });

    expect(response).toMatchObject({
      status: 200,
      body: {
        UserId: userId,
        rating: 5,
        description: 'This app is great!',
        $created: new Date(clock.now).toJSON(),
        $updated: new Date(clock.now).toJSON(),
      },
    });
  });

  it('should replace existing ratings on app', async () => {
    const app = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organizationId,
      },
      { raw: true },
    );

    await AppRating.create({
      AppId: app.id,
      UserId: userId,
      rating: 5,
      description: 'This app is great!',
    });

    const responseA = await request(server).get(`/api/apps/${app.id}/ratings`);
    clock.tick(20e3);
    const responseB = await request(server)
      .post(`/api/apps/${app.id}/ratings`)
      .set('Authorization', token)
      .send({ rating: 2, description: 'This app is so-so..' });
    const responseC = await request(server).get(`/api/apps/${app.id}/ratings`);

    expect(responseA).toMatchObject({
      status: 200,
      body: [
        {
          UserId: userId,
          rating: 5,
          description: 'This app is great!',
          $created: new Date(0).toJSON(),
          $updated: new Date(0).toJSON(),
        },
      ],
    });

    expect(responseB).toMatchObject({
      status: 200,
      body: {
        UserId: userId,
        rating: 2,
        description: 'This app is so-so..',
        $created: new Date(0).toJSON(),
        $updated: new Date(clock.now).toJSON(),
      },
    });

    expect(responseC).toMatchObject({
      status: 200,
      body: [
        {
          UserId: userId,
          rating: 2,
          description: 'This app is so-so..',
          $created: new Date(0).toJSON(),
          $updated: new Date(clock.now).toJSON(),
        },
      ],
    });
  });

  it('should allow stylesheets to be included when creating an app', async () => {
    const response = await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field('OrganizationId', organizationId)
      .field(
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
      )
      .attach('style', Buffer.from('body { color: blue; }'), {
        contentType: 'text/css',
        filename: 'test.css',
      })
      .attach('sharedStyle', Buffer.from(':root { --primary-color: purple; }'), {
        contentType: 'text/css',
        filename: 'test.css',
      });

    const style = await request(server).get(`/api/apps/${response.body.id}/style/core`);
    const sharedStyle = await request(server).get(`/api/apps/${response.body.id}/style/shared`);

    expect(response.status).toBe(201);
    expect(style.status).toBe(200);
    expect(style.text).toStrictEqual('body { color: blue; }');
    expect(sharedStyle.status).toBe(200);
    expect(sharedStyle.text).toStrictEqual(':root { --primary-color: purple; }');
  });

  it('should not allow invalid core stylesheets when creating an app', async () => {
    const responseA = await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field('OrganizationId', organizationId)
      .field(
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
      )
      .attach('style', Buffer.from('this is invalid css'), {
        contentType: 'text/css',
        filename: 'test.css',
      });

    const responseB = await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field('OrganizationId', organizationId)
      .field(
        'definition',
        JSON.stringify({
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [{ type: 'test' }],
            },
          ],
        }),
      )
      .attach('style', Buffer.from('.foo { margin: 0 auto; }'), {
        contentType: 'application/json',
        filename: 'test.css',
      });

    expect(responseA.status).toBe(400);
    expect(responseB.status).toBe(400);
  });

  it('should not allow invalid shared stylesheets when creating an app', async () => {
    const responseA = await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field('OrganizationId', organizationId)
      .field(
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
      )
      .attach('sharedStyle', Buffer.from('this is invalid css'), {
        contentType: 'text/css',
        filename: 'test.css',
      });

    const responseB = await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field('OrganizationId', organizationId)
      .field(
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
      )
      .attach('sharedStyle', Buffer.from('.foo { margin: 0 auto; }'), {
        contentType: 'application/json',
        filename: 'test.css',
      });

    expect(responseA.status).toBe(400);
    expect(responseB.status).toBe(400);
  });

  it('should not update a non-existent app', async () => {
    const response = await request(server)
      .patch('/api/apps/1')
      .set('Authorization', token)
      .field(
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

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('App not found');
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
    const response = await request(server)
      .patch(`/api/apps/${appA.id}`)
      .set('Authorization', token)
      .field('private', true)
      .field(
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

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
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
    const response = await request(server)
      .patch(`/api/apps/${appA.id}`)
      .set('Authorization', token)
      .field(
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
      )
      .attach(
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

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Provided YAML was invalid.',
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
    const response = await request(server)
      .patch(`/api/apps/${appA.id}`)
      .set('Authorization', token)
      .field(
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
      )
      .attach(
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

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Provided YAML was not equal to definition when converted.',
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

    const response = await request(server)
      .patch(`/api/apps/${appA.id}`)
      .set('Authorization', token)
      .field(
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
      )
      .attach('yaml', Buffer.from(yaml));

    expect(response.status).toBe(200);
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

    const response = await request(server)
      .patch(`/api/apps/${appA.id}`)
      .set('Authorization', token)
      .field('domain', 'appsemble.app');

    expect(response.status).toBe(200);
    expect(response.body.domain).toStrictEqual('appsemble.app');
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

    const response = await request(server)
      .patch(`/api/apps/${appA.id}`)
      .set('Authorization', token)
      .field('domain', '');

    expect(response.status).toBe(200);
    expect(response.body.domain).toBeNull();
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

    const response = await request(server)
      .patch(`/api/apps/${appA.id}`)
      .set('Authorization', token)
      .field(
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
      )
      .attach('yaml', buffer);

    const responseBuffer = Buffer.from(response.body.yaml);
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

    const response = await request(server)
      .patch(`/api/apps/${appA.id}`)
      .set('Authorization', token)
      .field(
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

    expect(response.body).toStrictEqual({
      statusCode: 403,
      error: 'Forbidden',
      message: "User does not belong in this App's organization.",
    });
  });

  it('should validate an app on creation', async () => {
    const response = await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field('app', JSON.stringify({ foo: 'bar' }));

    expect(response.status).toBe(400);
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
    const response = await request(server)
      .patch(`/api/apps/${appA.id}`)
      .set('Authorization', token)
      .field('definition', JSON.stringify({ name: 'Foobar' }));

    expect(response.status).toBe(400);
  });

  it('should delete an app', async () => {
    const {
      body: { id },
    } = await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field('OrganizationId', organizationId)
      .field(
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

    const response = await request(server)
      .delete(`/api/apps/${id}`)
      .set('Authorization', token);

    expect(response.status).toBe(204);
  });

  it('should not delete non-existent apps', async () => {
    const response = await request(server)
      .delete('/api/apps/0')
      .set('Authorization', token);

    expect(response.status).toBe(404);
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

    const response = await request(server)
      .delete(`/api/apps/${app.id}`)
      .set('Authorization', token);

    expect(response.status).toBe(403);
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

    const response = await request(server)
      .patch(`/api/apps/${app.id}`)
      .set('Authorization', token)
      .field(
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
      )
      .attach('style', Buffer.from('body { color: yellow; }'), {
        contentType: 'text/css',
        filename: 'style.css',
      })
      .attach('sharedStyle', Buffer.from('body { color: blue; }'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    const style = await request(server).get(`/api/apps/${response.body.id}/style/core`);
    const sharedStyle = await request(server).get(`/api/apps/${response.body.id}/style/shared`);

    expect(response.status).toBe(200);
    expect(style.status).toBe(200);
    expect(style.text).toStrictEqual('body { color: yellow; }');
    expect(sharedStyle.status).toBe(200);
    expect(sharedStyle.text).toStrictEqual('body { color: blue; }');
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

    const responseA = await request(server)
      .patch(`/api/apps/${app.id}`)
      .set('Authorization', token)
      .field(
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
      )
      .attach('style', Buffer.from('this is invalid css'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    const responseB = await request(server)
      .patch(`/api/apps/${app.id}`)
      .set('Authorization', token)
      .field(
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
      )
      .attach('style', Buffer.from('.foo { margin: 0 auto; }'), {
        contentType: 'application/json',
        filename: 'style.json',
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

    const responseA = await request(server)
      .patch(`/api/apps/${app.id}`)
      .set('Authorization', token)
      .field(
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
      )
      .attach('sharedStyle', Buffer.from('this is invalid css'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    const responseB = await request(server)
      .patch(`/api/apps/${app.id}`)
      .set('Authorization', token)
      .field(
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
      )
      .attach('sharedStyle', Buffer.from('.foo { margin: 0 auto; }'), {
        contentType: 'application/json',
        filename: 'style.json',
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

    const responseA = await request(server)
      .post(`/api/apps/${id}/style/block/@appsemble/testblock`)
      .set('Authorization', token)
      .attach('style', Buffer.from('body { color: blue; }'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    const responseB = await request(server)
      .post(`/api/apps/${id}/style/block/@appsemble/testblock`)
      .set('Authorization', token)
      .attach('style', Buffer.from(' '), {
        contentType: 'text/css',
        filename: 'style.css',
      });

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

    const response = await request(server)
      .post(`/api/apps/${id}/style/block/@appsemble/styledblock`)
      .set('Authorization', token)
      .attach('style', Buffer.from('invalidCss'));

    expect(response.body).toStrictEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Provided CSS was invalid.',
    });
  });

  it('should not allow uploading block stylesheets to non-existant apps', async () => {
    await BlockDefinition.create({
      id: '@appsemble/block',
      description: 'This is a test block for testing purposes.',
    });

    const response = await request(server)
      .post('/api/apps/0/style/block/@appsemble/block')
      .set('Authorization', token)
      .attach('style', Buffer.from('body { color: red; }'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    expect(response.body).toStrictEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'App not found.',
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

    const response = await request(server)
      .post(`/api/apps/${id}/style/block/@appsemble/doesntexist`)
      .set('Authorization', token)
      .attach('style', Buffer.from('body { color: red; }'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    expect(response.body).toStrictEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Block not found.',
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

    const response = await request(server).get(
      `/api/apps/${id}/style/block/@appsemble/doesntexist`,
    );

    expect(response.text).toBe('');
    expect(response.type).toBe('text/css');
    expect(response.status).toBe(200);
  });

  it('should not allow to update an app using non-existent blocks', async () => {
    const { status } = await request(server)
      .patch('/api/apps/1')
      .set('Authorization', token)
      .field(
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
      )
      .field('organizationId', organizationId);

    expect(status).toBe(400);
  });

  it('should not allow to update an app using non-existent block versions', async () => {
    const { body } = await request(server)
      .patch('/api/apps/1')
      .set('Authorization', token)
      .field(
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

    expect(body).toStrictEqual({
      data: {
        'pages.0.blocks.0': 'Unknown block type “@appsemble/test”',
      },
      error: 'Bad Request',
      message: 'Block validation failed',
      statusCode: 400,
    });
  });
});
