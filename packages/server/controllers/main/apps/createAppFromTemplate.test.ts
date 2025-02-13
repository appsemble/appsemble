import { getS3FileBuffer, uploadS3File } from '@appsemble/node-utils';
import {
  type AppConfigEntry,
  type AppMessages as AppMessagesType,
  type App as AppType,
} from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { parse } from 'yaml';

import {
  App,
  AppBlockStyle,
  AppMessages,
  AppOAuth2Secret,
  AppSamlSecret,
  AppServiceSecret,
  AppSnapshot,
  AppVariable,
  Asset,
  Organization,
  OrganizationMember,
  Resource,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';

let templates: App[];

describe('createAppFromTemplate', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(0);
    const user = await createTestUser();
    const organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await Organization.create({
      id: 'test-organization-2',
      name: 'Test Organization 2',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: 'Maintainer',
    });

    // Ensure formatting is preserved.
    const yaml1 =
      "'name': Test Template\n'description': Description\n\n# comment\n\npages: []\n\n\n";
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
      sslKey: 'sslKey',
      sslCertificate: 'sslCertificate',
      scimEnabled: true,
      scimToken: 'scimToken',
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
    const asset1 = await Asset.create({
      AppId: t2.id,
      name: 'test-clonable',
      clonable: true,
    });
    vi.useRealTimers();
    await uploadS3File(`app-${t2.id}`, asset1.id, Buffer.from('test'));
    const asset2 = await Asset.create({ AppId: t2.id, name: 'test' });
    await uploadS3File(`app-${t2.id}`, asset2.id, Buffer.from('test'));
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
    await AppVariable.create({
      AppId: t2.id,
      name: 'test',
      value: 'test',
    });
    await AppOAuth2Secret.create({
      AppId: t2.id,
      name: 'test',
      authorizationUrl: 'authorizationUrl',
      tokenUrl: 'tokenUrl',
      userInfoUrl: 'userInfoUrl',
      remapper: [{ prop: 'name' }],
      clientId: 'clientId',
      clientSecret: 'clientSecret',
      icon: 'icon',
      scope: 'scope',
    });
    await AppSamlSecret.create({
      AppId: t2.id,
      name: 'test',
      idpCertificate: 'idpCertificate',
      entityId: 'entityId',
      ssoUrl: 'ssoUrl',
      icon: 'icon',
      spPrivateKey: 'spPrivateKey',
      spPublicKey: 'spPublicKey',
      spCertificate: 'spCertificate',
      emailAttribute: 'emailAttribute',
      nameAttribute: 'nameAttribute',
    });
    await AppServiceSecret.create({
      AppId: t2.id,
      name: 'test',
      urlPatterns: 'urlPatterns',
      authenticationMethod: 'custom-header',
      identifier: 'identifier',
      secret: Buffer.from('secret'),
      tokenUrl: 'tokenUrl',
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
    vi.useRealTimers();
    vi.useFakeTimers();
    vi.advanceTimersByTime(1000);
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

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should create a new app using a template', async () => {
    authorizeStudio();
    const response = await request.post<AppType>('/api/app-templates', {
      templateId: templates[0].id,
      name: 'Test app',
      description: 'This is a test app',
      organizationId: 'testorganization',
    });

    expect(response.status).toBe(201);
    expect(response.data).toStrictEqual(
      expect.objectContaining({
        OrganizationId: 'testorganization',
        definition: {
          description: 'This is a test app',
          name: 'Test app',
          pages: [],
        },
        iconUrl: null,
        id: response.data.id,
        path: 'test-app',
        visibility: 'unlisted',
        yaml: "'name': Test app\n'description': This is a test app\n\n# comment\n\npages: []\n",
      }),
    );
  });

  it('should create a new app with example resources', async () => {
    const [, template] = templates;
    vi.useRealTimers();
    authorizeStudio();
    const response = await request.post<AppType>('/api/app-templates', {
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

  it('should create a new app with example assets', async () => {
    const [, template] = templates;
    vi.useRealTimers();
    authorizeStudio();
    const response = await request.post<AppType>('/api/app-templates', {
      templateId: template.id,
      name: 'Test app',
      description: 'This is a test app',
      organizationId: 'testorganization',
      assets: true,
    });

    const { id } = response.data;
    const assets = await Asset.findAll({ where: { AppId: id } });

    for (const asset of assets) {
      expect(asset.name).toBe('test-clonable');
      expect(await getS3FileBuffer(`app-${id}`, asset.id)).toStrictEqual(Buffer.from('test'));
    }
    expect(assets.map((a) => a.name)).toStrictEqual(['test-clonable']);
  });

  it('should include the app’s styles when cloning an app', async () => {
    const [, template] = templates;
    vi.useRealTimers();
    authorizeStudio();
    const response = await request.post<AppType>('/api/app-templates', {
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
    vi.useRealTimers();
    authorizeStudio();
    const response = await request.post<App>('/api/app-templates', {
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

  it('should copy app variables when cloning an app', async () => {
    const [, template] = templates;
    vi.useRealTimers();
    authorizeStudio();
    const response = await request.post<App>('/api/app-templates', {
      templateId: template.id,
      name: 'Test app',
      description: 'This is a test app',
      organizationId: 'testorganization',
      variables: true,
    });

    const { id } = response.data;
    const { data: variables } = await request.get<AppConfigEntry[]>(`/api/apps/${id}/variables`);

    expect(variables[0]).toStrictEqual({
      id: 2,
      name: 'test',
      value: 'test',
    });
  });

  it('should copy app secrets when cloning an app', async () => {
    const [, template] = templates;
    vi.useRealTimers();
    authorizeStudio();
    const response = await request.post<App>('/api/app-templates', {
      templateId: template.id,
      name: 'Test app',
      description: 'This is a test app',
      organizationId: 'testorganization',
      secrets: true,
    });

    const { id } = response.data;

    const appServiceSecret = await AppServiceSecret.findOne({
      attributes: ['name', 'authenticationMethod', 'urlPatterns', 'identifier', 'secret'],
      where: {
        AppId: id,
      },
    });

    expect(appServiceSecret.toJSON()).toStrictEqual({
      name: 'test',
      authenticationMethod: 'custom-header',
      urlPatterns: 'urlPatterns',
      identifier: 'identifier',
      secret: Buffer.from('placeholder'),
    });

    const appSamlSecret = await AppSamlSecret.findOne({
      attributes: [
        'name',
        'icon',
        'nameAttribute',
        'emailAttribute',
        'emailVerifiedAttribute',
        'idpCertificate',
        'spPrivateKey',
        'spPublicKey',
        'entityId',
        'ssoUrl',
      ],
      where: {
        AppId: id,
      },
    });

    expect(appSamlSecret.toJSON()).toStrictEqual({
      emailAttribute: 'emailAttribute',
      emailVerifiedAttribute: null,
      entityId: 'entityId',
      icon: 'icon',
      id: 2,
      name: 'test',
      nameAttribute: 'nameAttribute',
      ssoUrl: 'ssoUrl',
      spCertificate: '',
      idpCertificate: '',
      spPrivateKey: '',
      spPublicKey: '',
    });

    const appOAuth2Secret = await AppOAuth2Secret.findOne({
      attributes: [
        'name',
        'icon',
        'scope',
        'remapper',
        'authorizationUrl',
        'tokenUrl',
        'userInfoUrl',
        'clientId',
        'clientSecret',
      ],
      where: {
        AppId: id,
      },
    });

    expect(appOAuth2Secret).toMatchObject({
      authorizationUrl: 'authorizationUrl',
      clientId: '',
      clientSecret: '',
      icon: 'icon',
      name: 'test',
      remapper: [{ prop: 'name' }],
      scope: 'scope',
      tokenUrl: 'tokenUrl',
      userInfoUrl: 'userInfoUrl',
    });
  });

  it('should remove name and description when cloning an app', async () => {
    const [, template] = templates;
    vi.useRealTimers();
    authorizeStudio();
    const {
      data: { id },
    } = await request.post<App>('/api/app-templates', {
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
    await request.post('/api/app-templates', {
      templateId: templates[0].id,
      name: 'Test app',
      description: 'This is a test app',
      organizationId: 'testorganization',
    });

    const response = await request.post('/api/app-templates', {
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
    const response = await request.post('/api/app-templates', {
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

    const response = await request.post('/api/app-templates', {
      templateId: templates[2].id,
      name: 'Test app',
      description: 'This is also a test app',
      organizationId: 'testorganization',
    });

    expect(response.data).toMatchObject({
      statusCode: 403,
      message: 'User is not a member of this organization.',
    });
  });

  it('should not allow for cloning apps with hidden app definitions if the user is not in the same organization as the app', async () => {
    await templates[2].update({ showAppDefinition: false, visibility: 'public' });
    authorizeStudio();
    const response = await request.post('/api/app-templates', {
      templateId: templates[2].id,
      name: 'Test app',
      description: 'This is also a test app',
      organizationId: 'testorganization',
    });

    expect(response.data).toMatchObject({
      statusCode: 403,
      message: 'User is not a member of this organization.',
    });
  });
});
