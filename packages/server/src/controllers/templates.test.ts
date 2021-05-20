import { Clock, install } from '@sinonjs/fake-timers';
import { request, setTestApp } from 'axios-test-instance';
import { safeDump } from 'js-yaml';

import {
  App,
  AppBlockStyle,
  AppMessages,
  AppSnapshot,
  Member,
  Organization,
  Resource,
} from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import { authorizeStudio, createTestUser } from '../utils/test/authorization';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';

let templates: App[];
let clock: Clock;

beforeAll(createTestSchema('templates'));

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  const user = await createTestUser();
  const organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Maintainer' });
  clock = install();

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
    coreStyle: '.foo { color: blue; }',
    sharedStyle: '.bar { color: yellow; }',
    resources: {
      test: { schema: { type: 'object', properties: { name: { type: 'string' } } } },
    },
  });
  await Resource.create({ AppId: t2.id, type: 'test', data: { name: 'foo' }, clonable: true });
  await Resource.create({ AppId: t2.id, type: 'test', data: { name: 'bar' } });
  await AppMessages.create({
    AppId: t2.id,
    language: 'nl-nl',
    messages: { messageIds: { test: 'Dit is een testbericht' } },
  });
  t2.AppBlockStyles = [
    await AppBlockStyle.create({
      AppId: t2.id,
      block: '@appsemble/test',
      style: 'a { color: red; }',
    }),
  ];
  t1.AppSnapshots = [
    await AppSnapshot.create({ AppId: t1.id, UserId: user.id, yaml: safeDump(t1.definition) }),
  ];

  templates = [t1, t2];
});

afterEach(truncate);

afterEach(() => {
  clock.uninstall();
});

afterAll(closeTestSchema);

describe('getAppTemplates', () => {
  it('should return a list of available templates', async () => {
    authorizeStudio();
    const response = await request.get('/api/templates');

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
    authorizeStudio();
    const response = await request.post('/api/templates', {
      templateId: templates[0].id,
      name: 'Test app',
      description: 'This is a test app',
      organizationId: 'testorganization',
    });

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
    const [, template] = templates;
    authorizeStudio();
    const response = await request.post('/api/templates', {
      templateId: template.id,
      name: 'Test app',
      description: 'This is a test app',
      organizationId: 'testorganization',
      resources: true,
    });

    const { id } = response.data;
    const resources = await Resource.findAll({ where: { AppId: id, type: 'test' } });

    expect(resources.map((r) => r.data)).toStrictEqual([{ name: 'foo' }]);
  });

  it('should include the app’s styles when cloning an app', async () => {
    const [, template] = templates;
    authorizeStudio();
    const response = await request.post('/api/templates', {
      templateId: template.id,
      name: 'Test app',
      description: 'This is a test app',
      organizationId: 'testorganization',
      resources: true,
    });

    const { id } = response.data;
    const app = await App.findByPk(id, { include: [{ model: AppBlockStyle }] });

    expect(app.coreStyle).toStrictEqual(template.coreStyle);
    expect(app.sharedStyle).toStrictEqual(template.sharedStyle);
    expect(app.AppBlockStyles[0].style).toStrictEqual(template.AppBlockStyles[0].style);
  });

  it('should copy app messages when cloning an app', async () => {
    const [, template] = templates;
    authorizeStudio();
    const response = await request.post<App>('/api/templates', {
      templateId: template.id,
      name: 'Test app',
      description: 'This is a test app',
      organizationId: 'testorganization',
      resources: true,
    });

    const { id } = response.data;
    const { data: messages } = await request.get(`/api/apps/${id}/messages/nl-nl`);

    expect(messages.language).toStrictEqual('nl-nl');
    expect(messages.messages.messageIds).toStrictEqual({ test: 'Dit is een testbericht' });
  });

  it('should append a number when creating a new app using a template with a duplicate name', async () => {
    authorizeStudio();
    await request.post('/api/templates', {
      templateId: templates[0].id,
      name: 'Test app',
      description: 'This is a test app',
      organizationId: 'testorganization',
    });

    const response = await request.post('/api/templates', {
      templateId: templates[0].id,
      name: 'Test app',
      description: 'This is also a test app',
      organizationId: 'testorganization',
    });

    expect(response).toMatchObject({
      status: 201,
      data: {
        path: 'test-app-2',
      },
    });
  });

  it('should fall back to append random bytes to the end of the app path after 10 attempts', async () => {
    await Promise.all(
      Array.from({ length: 11 }, (unused, index) =>
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

    authorizeStudio();
    const response = await request.post('/api/templates', {
      templateId: templates[0].id,
      name: 'Test app',
      description: 'This is a test app',
      organizationId: 'testorganization',
    });

    expect(response).toMatchObject({
      status: 201,
      data: {
        path: expect.stringMatching(/test-app-(\w){10}/),
      },
    });
  });
});
