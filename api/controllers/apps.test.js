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
    db = await testSchema();

    server = koaServer({ db });
    ({ App } = db);
  });

  beforeEach(async () => {
    await truncate(db);
    token = await testToken(request, server, db, 'apps:write apps:read');
  });

  afterAll(async () => {
    await db.close();
  });

  it('should be able to add an app in DB', async () => {
    let count = await App.count();
    expect(count).toBe(0);

    const app = await App.create({ definition: { name: 'Test App', defaultPage: 'Test Page' } });
    expect(app).toBeTruthy();

    count = await App.count();
    expect(count).toBe(1);
  });

  it('should call the API', async () => {
    const response = await request(server).get('/api/');
    expect(response.text).toEqual('Not Found');
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
      { definition: { name: 'Test App', defaultPage: 'Test Page' } },
      { raw: true },
    );
    const appB = await App.create(
      { definition: { name: 'Another App', defaultPage: 'Another Page' } },
      { raw: true },
    );
    const { body } = await request(server)
      .get('/api/apps')
      .set('Authorization', token);

    expect(Array.isArray(body)).toBeTruthy();
    expect(body).toHaveLength(2);
    expect(body).toContainEqual({ id: appA.id, ...appA.definition });
    expect(body).toContainEqual({ id: appB.id, ...appB.definition });
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
      { definition: { name: 'Test App', defaultPage: 'Test Page' } },
      { raw: true },
    );
    const { body } = await request(server)
      .get(`/api/apps/${appA.id}`)
      .set('Authorization', token);

    expect(body).toEqual({ id: appA.id, ...appA.definition });
  });

  it('should create an app', async () => {
    const { body } = await request(server)
      .post('/api/apps')
      .send({ name: 'Test App', defaultPage: 'Test Page' })
      .set('Authorization', token);

    expect(body).toBeDefined();
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
      { definition: { name: 'Test App', defaultPage: 'Test Page' } },
      { raw: true },
    );
    const response = await request(server)
      .put(`/api/apps/${appA.id}`)
      .send({ name: 'Foobar', defaultPage: appA.definition.defaultPage })
      .set('Authorization', token);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Foobar');
    expect(response.body).toEqual({
      id: appA.id,
      name: 'Foobar',
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
      { definition: { name: 'Test App', defaultPage: 'Test Page' } },
      { raw: true },
    );
    const response = await request(server)
      .put(`/api/apps/${appA.id}`)
      .send({ name: 'Foobar' })
      .set('Authorization', token);

    expect(response.status).toBe(400);
    expect(response.body[0].message).toBe("should have required property 'defaultPage'");
  });
});
