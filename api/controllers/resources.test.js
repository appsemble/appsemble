import request from 'supertest';

import koaServer from '../server';
import testSchema from '../utils/test/testSchema';
import truncate from '../utils/test/truncate';

describe('resource controller', () => {
  let App;
  let db;
  let server;

  const exampleApp = {
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
      definitions: {
        testResource: {
          type: 'object',
          required: ['foo'],
          properties: { foo: { type: 'string' } },
        },
      },
    },
    path: 'test-app',
  };

  beforeAll(async () => {
    db = await testSchema();

    server = await koaServer({ db });
    ({ App } = db.models);
  });

  beforeEach(async () => {
    await truncate(db);
  });

  afterAll(async () => {
    await db.close();
  });

  it('should be able to fetch a resource', async () => {
    const app = await App.create(exampleApp);

    const resource = await app.createResource({ type: 'testResource', data: { foo: 'bar' } });
    const response = await request(server).get(`/api/apps/${app.id}/testResource/${resource.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: resource.id, foo: 'bar' });
  });

  it('should be able to fetch all resources of a type', async () => {
    const app = await App.create(exampleApp);

    const resourceA = await app.createResource({ type: 'testResource', data: { foo: 'bar' } });
    const resourceB = await app.createResource({ type: 'testResource', data: { foo: 'baz' } });

    const response = await request(server).get(`/api/apps/${app.id}/testResource`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: resourceA.id, foo: 'bar' },
      { id: resourceB.id, foo: 'baz' },
    ]);
  });

  it('should be able to create a new resource', async () => {
    const app = await App.create(exampleApp);

    const resource = { foo: 'bar' };
    const response = await request(server)
      .post(`/api/apps/${app.id}/testResource`)
      .send(resource);

    expect(response.status).toBe(201);
    expect(response.body.foo).toEqual(resource.foo);
    expect(response.body.id).toBeTruthy();
  });

  it('should validate resources', async () => {
    const app = await App.create(exampleApp);

    const resource = {};
    const response = await request(server)
      .post(`/api/apps/${app.id}/testResource`)
      .send(resource);

    expect(response.status).toBe(400);
    expect(response.body.data.foo.required).toBeTruthy();
  });

  it('should check if an app has a specific resource definition', async () => {
    const app = await App.create(exampleApp);

    const response = await request(server).get(`/api/apps/${app.id}/thisDoesNotExist`);
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('App does not have resources called thisDoesNotExist');
  });

  it('should check if an app has any resource definitions', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
    });
    const response = await request(server).get(`/api/apps/${app.id}/thisDoesNotExist`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('App does not have any resources defined');
  });
});
