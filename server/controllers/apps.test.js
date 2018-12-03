import request from 'supertest';

import createServer from '../utils/createServer';
import truncate from '../utils/test/truncate';
import testSchema from '../utils/test/testSchema';
import testToken from '../utils/test/testToken';

describe('app controller', () => {
  let App;
  let BlockDefinition;
  let BlockVersion;
  let db;
  let server;
  let token;

  beforeAll(async () => {
    db = await testSchema('apps');

    server = await createServer({ db });
    ({ App, BlockDefinition, BlockVersion } = db.models);
  });

  beforeEach(async () => {
    await truncate(db);
    token = await testToken(request, server, db, 'apps:write apps:read');
    await BlockDefinition.create({
      id: '@appsemble/test',
    });
    await BlockVersion.create({
      name: '@appsemble/test',
      version: '0.0.0',
    });
  });

  afterAll(async () => {
    await db.close();
  });

  it('should return an empty array of apps', async () => {
    const { body } = await request(server)
      .get('/api/apps')
      .set('Authorization', token);

    expect(Array.isArray(body)).toBeTruthy();
    expect(body).toHaveLength(0);
  });

  it('should return an array of apps', async () => {
    const appA = await App.create(
      { path: 'test-app', definition: { name: 'Test App', defaultPage: 'Test Page' } },
      { raw: true },
    );
    const appB = await App.create(
      { path: 'another-app', definition: { name: 'Another App', defaultPage: 'Another Page' } },
      { raw: true },
    );
    const { body } = await request(server)
      .get('/api/apps')
      .set('Authorization', token);

    expect(Array.isArray(body)).toBeTruthy();
    expect(body).toHaveLength(2);
    expect(body).toContainEqual({ id: appA.id, path: 'test-app', ...appA.definition });
    expect(body).toContainEqual({ id: appB.id, path: 'another-app', ...appB.definition });
  });

  it('should return 404 when fetching a non-existent app', async () => {
    const response = await request(server).get('/api/apps/1');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('App not found');
  });

  it('should fetch an existing app', async () => {
    const appA = await App.create(
      { path: 'test-app', definition: { name: 'Test App', defaultPage: 'Test Page' } },
      { raw: true },
    );
    const { body } = await request(server).get(`/api/apps/${appA.id}`);

    expect(body).toStrictEqual({ id: appA.id, path: 'test-app', ...appA.definition });
  });

  it('should create an app', async () => {
    const { body: created } = await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field(
        'app',
        JSON.stringify({
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test page',
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
      id: expect.any(Number),
      name: 'Test App',
      defaultPage: 'Test Page',
      path: 'test-app',
      pages: [
        {
          name: 'Test page',
          blocks: [
            {
              type: 'test',
              version: '0.0.0',
            },
          ],
        },
      ],
    });
    const { body: retrieved } = await request(server).get(`/api/apps/${created.id}`);
    expect(retrieved).toStrictEqual(created);
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

  it('should not allow to create an app using non-existent blocks', async () => {
    const { body } = await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field(
        'app',
        JSON.stringify({
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test page',
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
        'pages.0.blocks.0': 'Unknown block version “@non/existent@0.0.0”',
      },
      error: 'Bad Request',
      message: 'Unknown blocks or block versions found',
      statusCode: 400,
    });
  });

  it('should not allow to create an app using non-existent block versions', async () => {
    const { body } = await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field(
        'app',
        JSON.stringify({
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test page',
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
        'pages.0.blocks.0': 'Unknown block version “@appsemble/test@0.0.1”',
      },
      error: 'Bad Request',
      message: 'Unknown blocks or block versions found',
      statusCode: 400,
    });
  });

  it('should handle app path conflicts on create', async () => {
    await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field(
        'app',
        JSON.stringify({
          name: 'Test App',
          defaultPage: 'Test Page',
          path: 'a',
          pages: [
            {
              name: 'Test page',
              blocks: [{ type: 'test', version: '0.0.0' }],
            },
          ],
        }),
      );
    const response = await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field(
        'app',
        JSON.stringify({
          name: 'Test App',
          defaultPage: 'Test Page',
          path: 'a',
          pages: [
            {
              name: 'Test page',
              blocks: [{ type: 'test', version: '0.0.0' }],
            },
          ],
        }),
      );

    expect(response.status).toBe(409);
    expect(response.body).toStrictEqual({
      error: 'Conflict',
      message: 'Another app with path “a” already exists',
      statusCode: 409,
    });
  });

  it('should allow stylesheets to be included when creating an app', async () => {
    const response = await request(server)
      .post('/api/apps')
      .set('Authorization', token)
      .field(
        'app',
        JSON.stringify({
          name: 'Foobar',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test page',
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
      .field(
        'app',
        JSON.stringify({
          name: 'Test App',
          defaultPage: 'Test Page',
          path: 'a',
          pages: [
            {
              name: 'Test page',
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
      .field(
        'app',
        JSON.stringify({
          name: 'Test App',
          defaultPage: 'Test Page',
          path: 'a',
          pages: [
            {
              name: 'Test page',
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
      .field(
        'app',
        JSON.stringify({
          name: 'Test App',
          defaultPage: 'Test Page',
          path: 'a',
          pages: [
            {
              name: 'Test page',
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
      .field(
        'app',
        JSON.stringify({
          name: 'Test App',
          defaultPage: 'Test Page',
          path: 'a',
          pages: [
            {
              name: 'Test page',
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
      .put('/api/apps/1')
      .set('Authorization', token)
      .field(
        'app',
        JSON.stringify({
          name: 'Foobar',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test page',
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
      { path: 'test-app', definition: { name: 'Test App', defaultPage: 'Test Page' } },
      { raw: true },
    );
    const response = await request(server)
      .put(`/api/apps/${appA.id}`)
      .set('Authorization', token)
      .field(
        'app',
        JSON.stringify({
          name: 'Foobar',
          defaultPage: appA.definition.defaultPage,
          pages: [
            {
              name: 'Test page',
              blocks: [{ type: 'test', version: '0.0.0' }],
            },
          ],
        }),
      );

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      id: appA.id,
      name: 'Foobar',
      path: 'foobar',
      defaultPage: appA.definition.defaultPage,
      pages: [
        {
          name: 'Test page',
          blocks: [{ type: 'test', version: '0.0.0' }],
        },
      ],
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
      { path: 'foo', definition: { name: 'Test App', defaultPage: 'Test Page' } },
      { raw: true },
    );
    const response = await request(server)
      .put(`/api/apps/${appA.id}`)
      .set('Authorization', token)
      .field('app', JSON.stringify({ name: 'Foobar' }));

    expect(response.status).toBe(400);
  });

  it('should not allow an upload without an app when updating an app', async () => {
    const app = await App.create(
      { path: 'test-app', definition: { name: 'Test App', defaultPage: 'Test Page' } },
      { raw: true },
    );

    const response = await request(server)
      .put(`/api/apps/${app.id}`)
      .set('Authorization', token)
      .attach('style', Buffer.from('body { color: red; }'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    expect(response.status).toBe(400);
  });

  it('should prevent path conflicts when updating an app', async () => {
    await App.create(
      { path: 'foo', definition: { name: 'Test App', defaultPage: 'Test Page' } },
      { raw: true },
    );
    const appA = await App.create(
      { path: 'bar', definition: { name: 'Test App', defaultPage: 'Test Page' } },
      { raw: true },
    );
    const response = await request(server)
      .put(`/api/apps/${appA.id}`)
      .set('Authorization', token)
      .field(
        'app',
        JSON.stringify({
          path: 'foo',
          name: 'Foobar',
          defaultPage: appA.definition.defaultPage,
          pages: [
            {
              name: 'Test page',
              blocks: [{ type: 'test', version: '0.0.0' }],
            },
          ],
        }),
      );

    expect(response.status).toBe(409);
  });

  it('should validate and update css when updating an app', async () => {
    const app = await App.create(
      { path: 'bar', definition: { name: 'Test App', defaultPage: 'Test Page' } },
      { raw: true },
    );

    const response = await request(server)
      .put(`/api/apps/${app.id}`)
      .set('Authorization', token)
      .field(
        'app',
        JSON.stringify({
          path: 'foo',
          name: 'Foobar',
          defaultPage: app.definition.defaultPage,
          pages: [
            {
              name: 'Test page',
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
      { path: 'bar', definition: { name: 'Test App', defaultPage: 'Test Page' } },
      { raw: true },
    );

    const responseA = await request(server)
      .put(`/api/apps/${app.id}`)
      .set('Authorization', token)
      .field(
        'app',
        JSON.stringify({
          name: 'Test App',
          defaultPage: 'Test Page',
          path: 'a',
          pages: [
            {
              name: 'Test page',
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
      .put(`/api/apps/${app.id}`)
      .set('Authorization', token)
      .field(
        'app',
        JSON.stringify({
          name: 'Test App',
          defaultPage: 'Test Page',
          path: 'a',
          pages: [
            {
              name: 'Test page',
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
      { path: 'bar', definition: { name: 'Test App', defaultPage: 'Test Page' } },
      { raw: true },
    );

    const responseA = await request(server)
      .put(`/api/apps/${app.id}`)
      .set('Authorization', token)
      .field(
        'app',
        JSON.stringify({
          name: 'Test App',
          defaultPage: 'Test Page',
          path: 'a',
          pages: [
            {
              name: 'Test page',
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
      .put(`/api/apps/${app.id}`)
      .set('Authorization', token)
      .field(
        'app',
        JSON.stringify({
          name: 'Test App',
          defaultPage: 'Test Page',
          path: 'a',
          pages: [
            {
              name: 'Test page',
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

  it('should not allow to update an app using non-existent blocks', async () => {
    const { body } = await request(server)
      .put('/api/apps/1')
      .set('Authorization', token)
      .field(
        'app',
        JSON.stringify({
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test page',
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
        'pages.0.blocks.0': 'Unknown block version “@non/existent@0.0.0”',
      },
      error: 'Bad Request',
      message: 'Unknown blocks or block versions found',
      statusCode: 400,
    });
  });

  it('should not allow to update an app using non-existent block versions', async () => {
    const { body } = await request(server)
      .put('/api/apps/1')
      .set('Authorization', token)
      .field(
        'app',
        JSON.stringify({
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test page',
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
        'pages.0.blocks.0': 'Unknown block version “@appsemble/test@0.0.1”',
      },
      error: 'Bad Request',
      message: 'Unknown blocks or block versions found',
      statusCode: 400,
    });
  });
});
