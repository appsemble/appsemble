import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { parse } from 'yaml';

import {
  App,
  AppMessages,
  AppSnapshot,
  getAppDB,
  Organization,
  OrganizationMember,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';

let templates: App[];

describe('getAppTemplates', () => {
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
    const {
      AppBlockStyle,
      AppOAuth2Secret,
      AppSamlSecret,
      AppServiceSecret,
      AppVariable,
      Asset,
      Resource,
    } = await getAppDB(t2.id);
    await Resource.create({ type: 'test', data: { name: 'foo' }, clonable: true });
    await Resource.create({ type: 'test', data: { name: 'bar' } });
    await Asset.create({
      name: 'test-clonable',
      data: Buffer.from('test'),
      clonable: true,
    });

    await Asset.create({ name: 'test', data: Buffer.from('test') });
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
      name: 'test',
      value: 'test',
    });
    await AppOAuth2Secret.create({
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
      name: 'test',
      urlPatterns: 'urlPatterns',
      authenticationMethod: 'custom-header',
      identifier: 'identifier',
      secret: Buffer.from('secret'),
      tokenUrl: 'tokenUrl',
    });
    await AppBlockStyle.create({
      block: '@appsemble/test',
      style: 'a { color: red; }',
    });

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

  it('should return a list of available templates', async () => {
    authorizeStudio();
    const response = await request.get('/api/app-templates');

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
