import FakeTimers from '@sinonjs/fake-timers';
import { createInstance } from 'axios-test-instance';

import createServer from '../utils/createServer';
import testSchema from '../utils/test/testSchema';
import testToken from '../utils/test/testToken';
import truncate from '../utils/test/truncate';

let db;
let server;
let token;
let App;
let Resource;
let request;
let templates;
let user;
let clock;

beforeAll(async () => {
  db = await testSchema('templates');

  server = await createServer({ db, argv: { host: 'http://localhost', secret: 'test' } });
  request = await createInstance(server);
  ({ App, Resource } = db.models);
}, 10e3);

beforeEach(async () => {
  await truncate(db);
  ({ authorization: token, user } = await testToken(db));
  await user.createOrganization(
    {
      id: 'testorganization',
      name: 'Test Organization',
    },
    { through: { role: 'Maintainer' } },
  );
  clock = FakeTimers.install();

  const template = {
    path: 'test-template',
    template: true,
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
    OrganizationId: 'testorganization',
    definition: {
      name: 'Test Template',
      description: 'Description',
      pages: [],
    },
  };

  const t1 = await App.create(template, { raw: true });
  const t2 = await App.create(
    {
      ...template,
      path: 'test-template-2',
      definition: { ...template.definition, name: 'Test App 2' },
      resources: {
        test: { schema: { type: 'object', properties: { name: { type: 'string' } } } },
      },
    },
    { raw: true },
  );
  await t2.createResource({ type: 'test', data: { name: 'foo' } });

  templates = [t1, t2];
});

afterEach(() => {
  clock.uninstall();
});

afterAll(async () => {
  await request.close();
  await db.close();
});

describe('getAppTemplates', () => {
  it('should return a list of available templates', async () => {
    const response = await request.get('/api/templates', {
      headers: { authorization: token },
    });

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: templates[0].id,
          name: templates[0].definition.name,
          description: templates[0].definition.description,
          resources: false,
        },
        {
          id: templates[1].id,
          name: templates[1].definition.name,
          description: templates[1].definition.description,
          resources: true,
        },
      ],
    });
  });
});

describe('createTemplateApp', () => {
  it('should create a new app using a template', async () => {
    const response = await request.post(
      '/api/templates',
      {
        templateId: templates[0].id,
        name: 'Test app',
        description: 'This is a test app',
        organizationId: 'testorganization',
      },
      { headers: { authorization: token } },
    );

    expect(response).toMatchObject({
      status: 201,
      data: {
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        OrganizationId: 'testorganization',
        definition: {
          description: 'This is a test app',
          name: 'Test app',
          pages: [],
        },
        domain: null,
        iconUrl: '/api/apps/5/icon',
        id: 5,
        path: 'test-app',
        private: false,
        yaml: 'name: Test app\ndescription: This is a test app\npages: []\n',
      },
    });
  });

  it('should create a new app with example resources', async () => {
    const template = templates[1];
    const response = await request.post(
      '/api/templates',
      {
        templateId: template.id,
        name: 'Test app',
        description: 'This is a test app',
        organizationId: 'testorganization',
        resources: true,
      },
      { headers: { authorization: token } },
    );

    const { id } = response.data;
    const resources = await Resource.findAll({ where: { AppId: id, type: 'test' } }, { raw: true });

    expect(resources.map((r) => r.data)).toStrictEqual([{ name: 'foo' }]);
  });

  it('should append a number when creating a new app using a template with a duplicate name', async () => {
    await request.post(
      '/api/templates',
      {
        templateId: templates[0].id,
        name: 'Test app',
        description: 'This is a test app',
        organizationId: 'testorganization',
      },
      { headers: { authorization: token } },
    );

    const response = await request.post(
      '/api/templates',
      {
        templateId: templates[0].id,
        name: 'Test app',
        description: 'This is also a test app',
        organizationId: 'testorganization',
      },
      { headers: { authorization: token } },
    );

    expect(response).toMatchObject({
      status: 201,
      data: {
        path: 'test-app-2',
      },
    });
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
            OrganizationId: 'testorganization',
          },
          { raw: true },
        ),
      ),
    );

    const response = await request.post(
      '/api/templates',
      {
        templateId: templates[0].id,
        name: 'Test app',
        description: 'This is a test app',
        organizationId: 'testorganization',
      },
      { headers: { authorization: token } },
    );

    expect(response).toMatchObject({
      status: 201,
      data: {
        path: expect.stringMatching(/test-app-(\w){10}/),
      },
    });
  });
});
