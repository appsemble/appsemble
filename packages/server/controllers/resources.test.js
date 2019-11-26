import jwt from 'jsonwebtoken';
import lolex from 'lolex';
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
  let clock;

  const exampleApp = orgId => {
    return {
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
          testResourceB: {
            schema: {
              type: 'object',
              required: ['foo'],
              properties: { bar: { type: 'string' } },
            },
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: orgId,
    };
  };

  beforeAll(async () => {
    db = await testSchema('resources');
    server = await createServer({ db });
    ({ App, Resource } = db.models);
  }, 10e3);

  beforeEach(async () => {
    await truncate(db);
    token = await testToken(server, db, 'apps:write apps:read');
    organizationId = jwt.decode(token.substring(7)).user.organizations[0].id;
    clock = lolex.install();
  });

  afterEach(() => {
    clock.uninstall();
  });

  afterAll(async () => {
    await db.close();
  });

  it('should be able to fetch a resource', async () => {
    const app = await App.create(exampleApp(organizationId));

    const resource = await app.createResource({ type: 'testResource', data: { foo: 'bar' } });
    const response = await request(server).get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      id: resource.id,
      foo: 'bar',
      $created: new Date(0).toJSON(),
      $updated: new Date(0).toJSON(),
    });
  });

  it('should not be able to fetch a resources of a different app', async () => {
    const appA = await App.create(exampleApp(organizationId));
    const appB = await App.create({ ...exampleApp(organizationId), path: 'app-b' });

    const resource = await appA.createResource({ type: 'testResource', data: { foo: 'bar' } });
    const responseA = await request(server).get(
      `/api/apps/${appB.id}/resources/testResource/${resource.id}`,
    );
    const responseB = await request(server).get(
      `/api/apps/${appB.id}/resources/testResourceB/${resource.id}`,
    );

    expect(responseA.status).toBe(404);
    expect(responseB.status).toBe(404);
  });

  it('should be able to fetch all resources of a type', async () => {
    const app = await App.create(exampleApp(organizationId));

    const resourceA = await app.createResource({ type: 'testResource', data: { foo: 'bar' } });
    const resourceB = await app.createResource({ type: 'testResource', data: { foo: 'baz' } });
    await app.createResource({ type: 'testResourceB', data: { bar: 'baz' } });

    const response = await request(server).get(`/api/apps/${app.id}/resources/testResource`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      {
        id: resourceA.id,
        foo: 'bar',
        $created: new Date(0).toJSON(),
        $updated: new Date(0).toJSON(),
      },
      {
        id: resourceB.id,
        foo: 'baz',
        $created: new Date(0).toJSON(),
        $updated: new Date(0).toJSON(),
      },
    ]);
  });

  it('should be able to limit the amount of resources', async () => {
    const app = await App.create(exampleApp(organizationId));

    const resourceA = await app.createResource({ type: 'testResource', data: { foo: 'bar' } });
    await app.createResource({ type: 'testResource', data: { foo: 'baz' } });

    const response = await request(server).get(`/api/apps/${app.id}/resources/testResource?$top=1`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      {
        id: resourceA.id,
        foo: 'bar',
        $created: new Date(0).toJSON(),
        $updated: new Date(0).toJSON(),
      },
    ]);
  });

  it('should be able to sort fetched resources', async () => {
    const app = await App.create(exampleApp(organizationId));

    const resourceA = await app.createResource({ type: 'testResource', data: { foo: 'bar' } });
    clock.tick(20e3);
    const resourceB = await app.createResource({ type: 'testResource', data: { foo: 'baz' } });

    const responseA = await request(server).get(
      `/api/apps/${app.id}/resources/testResource?$orderby=foo asc`,
    );
    const responseB = await request(server).get(
      `/api/apps/${app.id}/resources/testResource?$orderby=foo desc`,
    );
    const responseC = await request(server).get(
      `/api/apps/${app.id}/resources/testResource?$orderby=$created asc`,
    );
    const responseD = await request(server).get(
      `/api/apps/${app.id}/resources/testResource?$orderby=$created desc`,
    );

    expect(responseA.status).toBe(200);
    expect(responseB.status).toBe(200);
    expect(responseC.status).toBe(200);
    expect(responseD.status).toBe(200);

    expect(responseA.body).toStrictEqual([
      {
        id: resourceA.id,
        foo: 'bar',
        $created: new Date(0).toJSON(),
        $updated: new Date(0).toJSON(),
      },
      {
        id: resourceB.id,
        foo: 'baz',
        $created: new Date(clock.now).toJSON(),
        $updated: new Date(clock.now).toJSON(),
      },
    ]);
    expect(responseB.body).toStrictEqual([
      {
        id: resourceB.id,
        foo: 'baz',
        $created: new Date(clock.now).toJSON(),
        $updated: new Date(clock.now).toJSON(),
      },
      {
        id: resourceA.id,
        foo: 'bar',
        $created: new Date(0).toJSON(),
        $updated: new Date(0).toJSON(),
      },
    ]);
    expect(responseC.body).toStrictEqual(responseA.body);
    expect(responseD.body).toStrictEqual(responseB.body);
  });

  it('should be able to select fields when fetching resources', async () => {
    const app = await App.create(exampleApp(organizationId));

    const resource = await app.createResource({ type: 'testResource', data: { foo: 'bar' } });
    const response = await request(server).get(
      `/api/apps/${app.id}/resources/testResource?$select=id`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([{ id: resource.id }]);
  });

  it('should be able to filter fields when fetching resources', async () => {
    const app = await App.create(exampleApp(organizationId));
    const resource = await app.createResource({ type: 'testResource', data: { foo: 'foo' } });
    await app.createResource({ type: 'testResource', data: { foo: 'bar' } });

    const response = await request(server).get(
      `/api/apps/${app.id}/resources/testResource?$filter=foo eq 'foo'`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      {
        id: resource.id,
        ...resource.data,
        $created: new Date(0).toJSON(),
        $updated: new Date(0).toJSON(),
      },
    ]);
  });

  it('should be able to filter multiple fields when fetching resources', async () => {
    const app = await App.create(exampleApp(organizationId));
    const resource = await app.createResource({
      type: 'testResource',
      data: { foo: 'foo', bar: 1 },
    });
    await app.createResource({ type: 'testResource', data: { foo: 'bar', bar: 2 } });

    const response = await request(server).get(
      `/api/apps/${app.id}/resources/testResource?$filter=substringof('oo', foo) and id le ${resource.id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      {
        id: resource.id,
        ...resource.data,
        $created: new Date(0).toJSON(),
        $updated: new Date(0).toJSON(),
      },
    ]);
  });

  it('should be able to combine multiple functions when fetching resources', async () => {
    const app = await App.create(exampleApp(organizationId));
    const resource = await app.createResource({
      type: 'testResource',
      data: { foo: 'foo', bar: 1 },
    });
    clock.tick(20e3);
    const resourceB = await app.createResource({
      type: 'testResource',
      data: { foo: 'bar', bar: 2 },
    });

    const response = await request(server).get(
      `/api/apps/${app.id}/resources/testResource?$filter=substringof('oo', foo) or foo eq 'bar'&$orderby=$updated desc&$select=id,$created,$updated`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      {
        id: resourceB.id,
        $created: new Date(clock.now).toJSON(),
        $updated: new Date(clock.now).toJSON(),
      },
      {
        id: resource.id,
        $created: new Date(0).toJSON(),
        $updated: new Date(0).toJSON(),
      },
    ]);
  });

  it('should be able to create a new resource', async () => {
    const app = await App.create(exampleApp(organizationId));

    const resource = { foo: 'bar' };
    const response = await request(server)
      .post(`/api/apps/${app.id}/resources/testResource`)
      .send(resource);

    expect(response.status).toBe(201);
    expect(response.body.foo).toStrictEqual(resource.foo);
    expect(response.body.id).toBeDefined();
  });

  it('should validate resources when creating resources', async () => {
    const app = await App.create(exampleApp(organizationId));

    const resource = {};
    const response = await request(server)
      .post(`/api/apps/${app.id}/resources/testResource`)
      .send(resource);

    expect(response.status).toBe(400);
    expect(response.body.data.foo.required).toBe(true);
  });

  it('should check if an app has a specific resource definition when creating resources', async () => {
    const app = await App.create(exampleApp(organizationId));

    const response = await request(server).get(`/api/apps/${app.id}/resources/thisDoesNotExist`);
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('App does not have resources called thisDoesNotExist');
  });

  it('should check if an app has any resource definitions when creating resources', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organizationId,
    });
    const response = await request(server).get(`/api/apps/${app.id}/resources/thisDoesNotExist`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('App does not have any resources defined');
  });

  it('should be able to update an existing resource', async () => {
    const app = await App.create(exampleApp(organizationId));
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    clock.tick(20e3);

    const response = await request(server)
      .put(`/api/apps/${app.id}/resources/testResource/${resource.id}`)
      .set('Authorization', token)
      .send({ foo: 'I am not Foo.' });

    expect(response.status).toBe(200);
    expect(response.body.foo).toStrictEqual('I am not Foo.');
    expect(response.body.id).toBe(resource.id);
    expect(response.body.$updated).not.toStrictEqual(response.body.$created);
    expect(new Date(response.body.$created).getTime()).toStrictEqual(0);
    expect(new Date(response.body.$updated).getTime()).toStrictEqual(20e3);

    const responseB = await request(server).get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(responseB.status).toBe(200);
    expect(responseB.body.foo).toStrictEqual('I am not Foo.');
    expect(responseB.body.id).toBe(resource.id);
    expect(new Date(responseB.body.$created).getTime()).toStrictEqual(0);
    expect(new Date(responseB.body.$updated).getTime()).toStrictEqual(20e3);
  });

  it('should not be possible to update an existing resource through another resource', async () => {
    const app = await App.create(exampleApp(organizationId));
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const response = await request(server)
      .put(`/api/apps/${app.id}/resources/testResourceB/${resource.id}`)
      .set('Authorization', token)
      .send({ foo: 'I am not Foo.' });

    expect(response.status).toBe(404);
  });

  it('should not be possible to update an existing resource through another app', async () => {
    const app = await App.create(exampleApp(organizationId));
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const appB = await App.create({ ...exampleApp(organizationId), path: 'app-b' });

    const response = await request(server)
      .put(`/api/apps/${appB.id}/resources/testResource/${resource.id}`)
      .set('Authorization', token)
      .send({ foo: 'I am not Foo.' });

    expect(response.status).toBe(404);
  });

  it('should not be possible to update a non-existent resource', async () => {
    const app = await App.create(exampleApp(organizationId));
    const { body } = await request(server)
      .put(`/api/apps/${app.id}/resources/testResource/0`)
      .send({ foo: 'I am not Foo.' })
      .set('Authorization', token);

    expect(body).toStrictEqual({
      error: 'Not Found',
      message: 'Resource not found',
      statusCode: 404,
    });
  });

  it('should validate resources when updating resources', async () => {
    const app = await App.create(exampleApp(organizationId));
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const response = await request(server)
      .put(`/api/apps/${app.id}/resources/testResource/${resource.id}`)
      .send({ bar: 123 })
      .set('Authorization', token);

    expect(response.status).toBe(400);
    expect(response.body.data.foo.required).toBe(true);
  });

  it('should be able to delete an existing resource', async () => {
    const app = await App.create(exampleApp(organizationId));
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const responseGetA = await request(server).get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(responseGetA.status).toBe(200);
    expect(responseGetA.body.foo).toStrictEqual('I am Foo.');
    expect(responseGetA.body.id).toBe(resource.id);

    const response = await request(server)
      .delete(`/api/apps/${app.id}/resources/testResource/${resource.id}`)
      .set('Authorization', token);

    expect(response.status).toBe(204);

    const responseGetB = await request(server).get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(responseGetB.status).toBe(404);
    expect(responseGetB.body).toStrictEqual({
      error: 'Not Found',
      message: 'Resource not found',
      statusCode: 404,
    });
  });

  it('should not be able to delete a non-existent resource', async () => {
    const app = await App.create(exampleApp(organizationId));
    const { body } = await request(server)
      .delete(`/api/apps/${app.id}/resources/testResource/0`)
      .set('Authorization', token);

    expect(body).toStrictEqual({
      error: 'Not Found',
      message: 'Resource not found',
      statusCode: 404,
    });
  });

  it('should not be possible to delete an existing resource through another resource', async () => {
    const app = await App.create(exampleApp(organizationId));
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const response = await request(server)
      .delete(`/api/apps/${app.id}/resources/testResourceB/${resource.id}`)
      .set('Authorization', token);

    expect(response.status).toBe(404);

    const responseGet = await request(server).get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(responseGet.status).toBe(200);
    expect(responseGet.body.foo).toStrictEqual('I am Foo.');
    expect(responseGet.body.id).toBe(resource.id);
  });

  it('should not be possible to delete an existing resource through another app', async () => {
    const app = await App.create(exampleApp(organizationId));
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const appB = await App.create({ ...exampleApp(organizationId), path: 'app-b' });
    const response = await request(server)
      .delete(`/api/apps/${appB.id}/resources/testResource/${resource.id}`)
      .set('Authorization', token);

    expect(response.status).toBe(404);

    const responseGet = await request(server).get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(responseGet.status).toBe(200);
    expect(responseGet.body.foo).toStrictEqual('I am Foo.');
    expect(responseGet.body.id).toBe(resource.id);
  });
});
