import jwt from 'jsonwebtoken';
import request from 'supertest';

import createServer from '../utils/createServer';
import testSchema from '../utils/test/testSchema';
import testToken from '../utils/test/testToken';
import truncate from '../utils/test/truncate';

describe('resource controller', () => {
  let App;
  let Resource;
  let db;
  let server;
  let token;
  let organizationId;

  const exampleApp = {
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
      resources: {
        testResource: {
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
        },
      },
    },
    path: 'test-app',
    OrganizationId: organizationId,
  };

  beforeAll(async () => {
    db = await testSchema('resources');
    server = await createServer({ db });
    organizationId = jwt.decode(token.substring(7)).user.organizations[0].id;

    ({ App, Resource } = db.models);
  }, 10e3);

  beforeEach(async () => {
    await truncate(db);
    token = await testToken(request, server, db, 'apps:write apps:read');
  });

  afterAll(async () => {
    await db.close();
  });

  it('should be able to fetch a resource', async () => {
    const app = await App.create(exampleApp);

    const resource = await app.createResource({ type: 'testResource', data: { foo: 'bar' } });
    const response = await request(server).get(`/api/apps/${app.id}/testResource/${resource.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({ id: resource.id, foo: 'bar' });
  });

  it('should be able to fetch all resources of a type', async () => {
    const app = await App.create(exampleApp);

    const resourceA = await app.createResource({ type: 'testResource', data: { foo: 'bar' } });
    const resourceB = await app.createResource({ type: 'testResource', data: { foo: 'baz' } });

    const response = await request(server).get(`/api/apps/${app.id}/testResource`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      { id: resourceA.id, foo: 'bar' },
      { id: resourceB.id, foo: 'baz' },
    ]);
  });

  it('should be able to limit the amount of resources', async () => {
    const app = await App.create(exampleApp);

    const resourceA = await app.createResource({ type: 'testResource', data: { foo: 'bar' } });
    await app.createResource({ type: 'testResource', data: { foo: 'baz' } });

    const response = await request(server).get(`/api/apps/${app.id}/testResource?$top=1`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([{ id: resourceA.id, foo: 'bar' }]);
  });

  it('should be able to sort fetched resources', async () => {
    const app = await App.create(exampleApp);

    const resourceA = await app.createResource({ type: 'testResource', data: { foo: 'bar' } });
    const resourceB = await app.createResource({ type: 'testResource', data: { foo: 'baz' } });

    const responseA = await request(server).get(
      `/api/apps/${app.id}/testResource?$orderby=foo asc`,
    );
    const responseB = await request(server).get(
      `/api/apps/${app.id}/testResource?$orderby=foo desc`,
    );

    expect(responseA.status).toBe(200);
    expect(responseA.body).toStrictEqual([
      { id: resourceA.id, foo: 'bar' },
      { id: resourceB.id, foo: 'baz' },
    ]);
    expect(responseB.status).toBe(200);
    expect(responseB.body).toStrictEqual([
      { id: resourceB.id, foo: 'baz' },
      { id: resourceA.id, foo: 'bar' },
    ]);
  });

  it('should be able to select fields when fetching resources', async () => {
    const app = await App.create(exampleApp);

    const resource = await app.createResource({ type: 'testResource', data: { foo: 'bar' } });
    const response = await request(server).get(`/api/apps/${app.id}/testResource?$select=id`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([{ id: resource.id }]);
  });

  it('should be able to create a new resource', async () => {
    const app = await App.create(exampleApp);

    const resource = { foo: 'bar' };
    const response = await request(server)
      .post(`/api/apps/${app.id}/testResource`)
      .send(resource);

    expect(response.status).toBe(201);
    expect(response.body.foo).toStrictEqual(resource.foo);
    expect(response.body.id).toBeDefined();
  });

  it('should validate resources when creating resources', async () => {
    const app = await App.create(exampleApp);

    const resource = {};
    const response = await request(server)
      .post(`/api/apps/${app.id}/testResource`)
      .send(resource);

    expect(response.status).toBe(400);
    expect(response.body.data.foo.required).toBe(true);
  });

  it('should check if an app has a specific resource definition when creating resources', async () => {
    const app = await App.create(exampleApp);

    const response = await request(server).get(`/api/apps/${app.id}/thisDoesNotExist`);
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('App does not have resources called thisDoesNotExist');
  });

  it('should check if an app has any resource definitions when creating resources', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
    });
    const response = await request(server).get(`/api/apps/${app.id}/thisDoesNotExist`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('App does not have any resources defined');
  });

  it('should be able to update an existing resource', async () => {
    const app = await App.create(exampleApp);
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const response = await request(server)
      .put(`/api/apps/${app.id}/testResource/${resource.id}`)
      .send({ foo: 'I am not Foo.' })
      .set('Authorization', token);

    expect(response.status).toBe(200);
    expect(response.body.foo).toStrictEqual('I am not Foo.');
    expect(response.body.id).toBe(resource.id);

    const responseB = await request(server).get(`/api/apps/${app.id}/testResource/${resource.id}`);

    expect(responseB.status).toBe(200);
    expect(responseB.body.foo).toStrictEqual({ foo: 'I am not Foo.' });
    expect(responseB.body.id).toBe(resource.id);
  });

  it('should not be possible to update a non-existent resource', async () => {
    const app = await App.create(exampleApp);
    const { body } = await request(server)
      .put(`/api/apps/${app.id}/testResource/0`)
      .send({ foo: 'I am not Foo.' })
      .set('Authorization', token);

    expect(body).toStrictEqual({
      error: 'Not Found',
      message: 'Resource not found',
      statusCode: 404,
    });
  });

  it('should validate resources when updating resources', async () => {
    const app = await App.create(exampleApp);
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const response = await request(server)
      .put(`/api/apps/${app.id}/testResource/${resource.id}`)
      .send({ bar: 123 })
      .set('Authorization', token);

    expect(response.status).toBe(400);
    expect(response.body.data.foo.required).toBe(true);
  });

  it('should be able to delete an existing resource', async () => {
    const app = await App.create(exampleApp);
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const responseGetA = await request(server).get(
      `/api/apps/${app.id}/testResource/${resource.id}`,
    );

    expect(responseGetA.status).toBe(200);
    expect(responseGetA.body.foo).toStrictEqual('I am Foo.');
    expect(responseGetA.body.id).toBe(resource.id);

    const response = await request(server)
      .delete(`/api/apps/${app.id}/testResource/${resource.id}`)
      .set('Authorization', token);

    expect(response.status).toBe(204);

    const responseGetB = await request(server).get(
      `/api/apps/${app.id}/testResource/${resource.id}`,
    );

    expect(responseGetB.status).toBe(404);
    expect(responseGetB.body).toStrictEqual({
      error: 'Not Found',
      message: 'Resource not found',
      statusCode: 404,
    });
  });

  it('should not be able to delete a non-existent resource', async () => {
    const app = await App.create(exampleApp);
    const { body } = await request(server)
      .delete(`/api/apps/${app.id}/testResource/0`)
      .set('Authorization', token);

    expect(body).toStrictEqual({
      error: 'Not Found',
      message: 'Resource not found',
      statusCode: 404,
    });
  });
});
