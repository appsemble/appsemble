import request from 'supertest';

import koaServer from '../server';
import truncate from '../utils/test/truncate';
import testSchema from '../utils/test/testSchema';
import testToken from '../utils/test/testToken';

describe('app controller', () => {
  let App;
  let db;
  let server;
  let token;

  beforeAll(async () => {
    db = await testSchema('apps');

    server = await koaServer({ db });
    ({ App } = db.models);
  });

  beforeEach(async () => {
    await truncate(db);
    token = await testToken(request, server, db, 'apps:write apps:read');
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
    const response = await request(server)
      .get('/api/apps/1')
      .set('Authorization', token);

    expect(response.ok).toBeFalsy();
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('App not found');
  });

  it('should fetch an existing app', async () => {
    const appA = await App.create(
      { path: 'test-app', definition: { name: 'Test App', defaultPage: 'Test Page' } },
      { raw: true },
    );
    const { body } = await request(server)
      .get(`/api/apps/${appA.id}`)
      .set('Authorization', token);

    expect(body).toStrictEqual({ id: appA.id, path: 'test-app', ...appA.definition });
  });

  it('should create an app', async () => {
    const { body } = await request(server)
      .post('/api/apps')
      .send({ name: 'Test App', defaultPage: 'Test Page' })
      .set('Authorization', token);

    expect(body).toBeDefined();
  });

  it('should handle app path conflicts on create', async () => {
    await request(server)
      .post('/api/apps')
      .send({ path: 'a', name: 'Test App', defaultPage: 'Test Page' })
      .set('Authorization', token);
    const response = await request(server)
      .post('/api/apps')
      .send({ path: 'a', name: 'Test App', defaultPage: 'Test Page' })
      .set('Authorization', token);

    expect(response.status).toBe(409);
    expect(response.body).toBeDefined();
  });

  it('should not update a non-existent app', async () => {
    const response = await request(server)
      .put('/api/apps/1')
      .send({ name: 'Foobar', defaultPage: 'Test Page' })
      .set('Authorization', token);

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
      .send({ name: 'Foobar', defaultPage: appA.definition.defaultPage })
      .set('Authorization', token);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Foobar');
    expect(response.body).toStrictEqual({
      id: appA.id,
      name: 'Foobar',
      path: 'foobar',
      defaultPage: appA.definition.defaultPage,
    });
  });

  it('should validate an app on creation', async () => {
    const response = await request(server)
      .post('/api/apps')
      .send({ foo: 'bar' })
      .set('Authorization', token);

    expect(response.ok).toBeFalsy();
    expect(response.status).toBe(400);
    expect(response.body[0].message).toBe("should have required property 'name'");
  });

  it('should validate an app on update', async () => {
    const appA = await App.create(
      { path: 'foo', definition: { name: 'Test App', defaultPage: 'Test Page' } },
      { raw: true },
    );
    const response = await request(server)
      .put(`/api/apps/${appA.id}`)
      .send({ name: 'Foobar' })
      .set('Authorization', token);

    expect(response.status).toBe(400);
    expect(response.body[0].message).toBe("should have required property 'defaultPage'");
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
      .send({ path: 'foo', name: 'Foobar', defaultPage: appA.definition.defaultPage })
      .set('Authorization', token);

    expect(response.status).toBe(409);
  });
});
