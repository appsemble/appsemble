import FakeTimers from '@sinonjs/fake-timers';
import { request, setTestApp } from 'axios-test-instance';

import { App, Member, Organization, Resource, User } from '../models';
import createServer from '../utils/createServer';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';
import testToken from '../utils/test/testToken';

let authorization: string;
let templates: App[];
let user: User;
let clock: FakeTimers.InstalledClock;

beforeAll(createTestSchema('templates'));

beforeAll(async () => {
  const server = await createServer({ argv: { host: 'http://localhost', secret: 'test' } });
  await setTestApp(server);
});

beforeEach(async () => {
  ({ authorization, user } = await testToken());
  const organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Maintainer' });
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
  } as const;

  const t1 = await App.create(template);
  const t2 = await App.create({
    ...template,
    path: 'test-template-2',
    definition: { ...template.definition, name: 'Test App 2' },
    resources: {
      test: { schema: { type: 'object', properties: { name: { type: 'string' } } } },
    },
  });
  await Resource.create({ AppId: t2.id, type: 'test', data: { name: 'foo' } });

  templates = [t1, t2];
});

afterEach(truncate);

afterEach(() => {
  clock.uninstall();
});

afterAll(closeTestSchema);

describe('getAppTemplates', () => {
  it('should return a list of available templates', async () => {
    const response = await request.get('/api/templates', {
      headers: { authorization },
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
      { headers: { authorization } },
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
        iconUrl: '/api/apps/3/icon',
        id: 3,
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
      { headers: { authorization } },
    );

    const { id } = response.data;
    const resources = await Resource.findAll({ where: { AppId: id, type: 'test' } });

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
      { headers: { authorization } },
    );

    const response = await request.post(
      '/api/templates',
      {
        templateId: templates[0].id,
        name: 'Test app',
        description: 'This is also a test app',
        organizationId: 'testorganization',
      },
      { headers: { authorization } },
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
      { headers: { authorization } },
    );

    expect(response).toMatchObject({
      status: 201,
      data: {
        path: expect.stringMatching(/test-app-(\w){10}/),
      },
    });
  });
});
