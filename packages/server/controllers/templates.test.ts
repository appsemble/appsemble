import { createServer } from '@appsemble/node-utils/createServer.js';
import { AppMessages as AppMessagesType, App as AppType } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { parse } from 'yaml';

import {
  App,
  AppBlockStyle,
  AppMessages,
  AppSnapshot,
  Member,
  Organization,
  Resource,
} from '../models/index.js';
import { appRouter } from '../routes/appRouter/index.js';
import { argv, setArgv } from '../utils/argv.js';
import { authorizeStudio, createTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';
import * as controllers from './index.js';

let templates: App[];

useTestDatabase(import.meta);

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer({
    argv,
    appRouter,
    controllers,
  });
  await setTestApp(server);
});

beforeEach(async () => {
  const user = await createTestUser();
  const organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await Organization.create({
    id: 'test-organization-2',
    name: 'Test Organization 2',
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Maintainer' });
  import.meta.jest.useFakeTimers({ now: 0 });

  // Ensure formatting is preserved.
  const yaml1 = "'name': Test Template\n'description': Description\n\n# comment\n\npages: []\n\n\n";
  const yaml2 =
    '"name": Test App 2\ndescription: Description\n\n# comment\n\npages: [{name: Test Page, blocks: []}]\n\n\n';

  const template = {
    path: 'test-template',
    template: true,
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
    OrganizationId: 'testorganization',
    definition: parse(yaml1),
  } as const;

  const t1 = await App.create(template);
  const t2 = await App.create({
    ...template,
    path: 'test-template-2',
    definition: parse(yaml2),
    coreStyle: '.foo { color: blue; }',
    sharedStyle: '.bar { color: yellow; }',
    resources: {
      test: { schema: { type: 'object', properties: { name: { type: 'string' } } } },
    },
  });
  const t3 = await App.create({
    ...template,
    template: false,
    OrganizationId: 'test-organization-2',
    path: 'test-template-3',
    visibility: 'private',
  });
  await Resource.create({ AppId: t2.id, type: 'test', data: { name: 'foo' }, clonable: true });
  await Resource.create({ AppId: t2.id, type: 'test', data: { name: 'bar' } });
  await AppMessages.create({
    AppId: t2.id,
    language: 'nl-nl',
    messages: {
      app: {
        name: 'Test app',
        description: 'this is test description',
        'test-page': 'Testpagina',
      },
      messageIds: { test: 'Dit is een testbericht' },
    },
  });
  t2.AppBlockStyles = [
    await AppBlockStyle.create({
      AppId: t2.id,
      block: '@appsemble/test',
      style: 'a { color: red; }',
    }),
  ];

  // Make sure the latest snapshot is used.
  const snapshot1 = await AppSnapshot.create({
    AppId: t1.id,
    UserId: user.id,
    yaml: '',
  });
  import.meta.jest.advanceTimersByTime(1000);
  t1.AppSnapshots = [
    snapshot1,
    await AppSnapshot.create({
      AppId: t1.id,
      UserId: user.id,
      yaml: yaml1,
    }),
  ];
  t2.AppSnapshots = [
    await AppSnapshot.create({
      AppId: t2.id,
      UserId: user.id,
      yaml: yaml2,
    }),
  ];
  t3.AppSnapshots = [
    snapshot1,
    await AppSnapshot.create({
      AppId: t3.id,
      UserId: user.id,
      yaml: yaml1,
    }),
  ];

  templates = [t1, t2, t3];
});

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
    const response = await request.post<AppType>('/api/templates', {
      templateId: templates[0].id,
      name: 'Test app',
      description: 'This is a test app',
      organizationId: 'testorganization',
    });

    expect(response).toMatchObject({
      status: 201,
      data: {
        $created: '1970-01-01T00:00:01.000Z',
        $updated: '1970-01-01T00:00:01.000Z',
        OrganizationId: 'testorganization',
        definition: {
          description: 'This is a test app',
          name: 'Test app',
          pages: [],
        },
        domain: null,
        iconUrl: null,
        id: response.data.id,
        path: 'test-app',
        visibility: 'unlisted',
        yaml: "'name': Test app\n'description': This is a test app\n\n# comment\n\npages: []\n",
      },
    });
  });

  it('should create a new app with example resources', async () => {
    const [, template] = templates;
    authorizeStudio();
    const response = await request.post<AppType>('/api/templates', {
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
    const response = await request.post<AppType>('/api/templates', {
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
    const { data: messages } = await request.get<AppMessagesType>(`/api/apps/${id}/messages/nl-nl`);

    expect(messages.language).toBe('nl-nl');
    expect(messages.messages.messageIds).toStrictEqual({ test: 'Dit is een testbericht' });
  });

  it('should remove name and description when cloning an app', async () => {
    const [, template] = templates;
    authorizeStudio();
    const {
      data: { id },
    } = await request.post<App>('/api/templates', {
      templateId: template.id,
      name: 'Test app',
      description: 'This is a test description',
      organizationId: 'testorganization',
      resources: true,
    });

    const translations = await AppMessages.findOne({
      where: { AppId: id, language: 'nl-nl' },
    });

    expect(translations.messages.app.name).toBeUndefined();
    expect(translations.messages.app.description).toBeUndefined();
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

  it('should not allow for cloning unlisted apps if the user is not in the same organization as the app', async () => {
    authorizeStudio();

    const response = await request.post('/api/templates', {
      templateId: templates[2].id,
      name: 'Test app',
      description: 'This is also a test app',
      organizationId: 'testorganization',
    });

    expect(response.data).toMatchObject({
      statusCode: 403,
      message: 'User is not part of this organization.',
    });
  });

  it('should not allow for cloning apps with hidden app definitions if the user is not in the same organization as the app', async () => {
    await templates[2].update({ showAppDefinition: false, visibility: 'public' });
    authorizeStudio();
    const response = await request.post('/api/templates', {
      templateId: templates[2].id,
      name: 'Test app',
      description: 'This is also a test app',
      organizationId: 'testorganization',
    });

    expect(response.data).toMatchObject({
      statusCode: 403,
      message: 'User is not part of this organization.',
    });
  });
});
