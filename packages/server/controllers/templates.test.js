import jwt from 'jsonwebtoken';
import lolex from 'lolex';
import request from 'supertest';

import createServer from '../utils/createServer';
import testSchema from '../utils/test/testSchema';
import testToken from '../utils/test/testToken';
import truncate from '../utils/test/truncate';

describe('Template API', () => {
  let db;
  let server;
  let token;
  let organizationId;
  let App;
  let Resource;

  let clock;

  beforeAll(async () => {
    db = await testSchema('templates');

    server = await createServer({ db });
    ({ App, Resource } = db.models);
  }, 10e3);

  beforeEach(async () => {
    await truncate(db);
    token = await testToken(request, server, db, 'apps:read apps:write');
    organizationId = jwt.decode(token.substring(7)).user.organizations[0].id;
    clock = lolex.install();
  });

  afterEach(() => {
    clock.uninstall();
  });

  afterAll(async () => {
    await db.close();
  });

  it('should return a list of available templates', async () => {
    const template = {
      path: 'test-template',
      template: true,
      OrganizationId: organizationId,
      definition: {
        name: 'Test Template',
        description: 'Description',
        pages: [],
      },
    };
    const { id } = await App.create(template);

    const { body: result } = await request(server).get('/api/templates');
    const expected = [{ ...template, id, resources: false }];

    expect(result).toStrictEqual(expected);
  });

  it('should create a new app using a template', async () => {
    const { body: result } = await request(server)
      .post('/api/templates')
      .set('Authorization', token)
      .send({
        template: templates[0].name,
        name: 'Test app',
        description: 'This is a test app',
        organizationId,
      });

    expect(result).toMatchSnapshot();
  });

  it('should create a new app with example resources', async () => {
    const template = templates.find(t => t.name === 'Person App');
    const { body: result } = await request(server)
      .post('/api/templates')
      .set('Authorization', token)
      .send({
        template: template.name,
        name: 'Test app',
        description: 'This is a test app',
        organizationId,
        resources: true,
      });

    const { id } = result;
    const resources = await Resource.findAll(
      { where: { AppId: id, type: 'person' } },
      { raw: true },
    );

    expect(resources.map(r => r.data)).toStrictEqual(
      expect.arrayContaining(template.resources.person),
    );
  });

  it('should append a number when creating a new app using a template with a duplicate name', async () => {
    await request(server)
      .post('/api/templates')
      .set('Authorization', token)
      .send({
        template: templates[0].name,
        name: 'Test app',
        description: 'This is a test app',
        organizationId,
      });

    const {
      status,
      body: { path },
    } = await request(server)
      .post('/api/templates')
      .set('Authorization', token)
      .send({
        template: templates[0].name,
        name: 'Test app',
        description: 'This is also a test app',
        organizationId,
      });

    expect(status).toStrictEqual(201);
    expect(path).toStrictEqual('test-app-2');
  });

  it('should fall back to append random bytes to the end of the app path after 10 attempts', async () => {
    await Promise.all(
      [...new Array(11)].map((_, index) =>
        App.create(
          {
            path: index + 1 === 1 ? 'test-app' : `test-app-${index + 1}`,
            definition: { name: 'Test App', defaultPage: 'Test Page' },
            vapidPublicKey: 'a',
            vapidPrivateKey: 'b',
            OrganizationId: organizationId,
          },
          { raw: true },
        ),
      ),
    );

    const {
      status,
      body: { path },
    } = await request(server)
      .post('/api/templates')
      .set('Authorization', token)
      .send({
        template: templates[0].name,
        name: 'Test app',
        description: 'This is a test app',
        organizationId,
      });

    expect(status).toStrictEqual(201);
    expect(path).toMatch(/test-app-(\w){10}/);
  });
});
