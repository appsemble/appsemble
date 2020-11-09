import { UserInfo } from '@appsemble/types';

import { App, AppMessages, Organization } from '../models';
import { getApp, getRemapperContext } from './app';
import { closeTestSchema, createTestSchema, truncate } from './test/testSchema';

let dbApp: App;

beforeAll(createTestSchema('getapp'));

beforeEach(async () => {
  await Organization.create({
    id: 'test-organization',
    name: 'Test Organization',
  });
});

afterEach(truncate);

afterAll(closeTestSchema);

describe('getApp', () => {
  it('should resolve an app by its default domain', async () => {
    dbApp = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'test-organization',
    });

    const app = await getApp(
      {
        argv: {
          host: 'http://localhost:9999',
        },
        origin: 'http://test-app.test-organization.localhost:9999',
      },
      {
        attributes: [
          'definition',
          'id',
          'OrganizationId',
          'sharedStyle',
          'coreStyle',
          'vapidPublicKey',
        ],
        raw: true,
      },
    );

    expect(app).toStrictEqual({
      definition: dbApp.definition,
      id: dbApp.id,
      OrganizationId: dbApp.OrganizationId,
      sharedStyle: dbApp.sharedStyle,
      coreStyle: dbApp.coreStyle,
      vapidPublicKey: dbApp.vapidPublicKey,
    });
  });

  it('should allow passing an optional url parameter', async () => {
    dbApp = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'test-organization',
    });

    const app = await getApp(
      {
        argv: {
          host: 'http://localhost:9999',
        },
        origin: 'http://localhost:9999',
      },
      {
        attributes: [
          'definition',
          'id',
          'OrganizationId',
          'sharedStyle',
          'coreStyle',
          'vapidPublicKey',
        ],
        raw: true,
      },
      'http://test-app.test-organization.localhost:9999',
    );

    expect(app).toStrictEqual({
      definition: dbApp.definition,
      id: dbApp.id,
      OrganizationId: dbApp.OrganizationId,
      sharedStyle: dbApp.sharedStyle,
      coreStyle: dbApp.coreStyle,
      vapidPublicKey: dbApp.vapidPublicKey,
    });
  });

  it('should resolve apps with custom domains', async () => {
    dbApp = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'test-organization',
      domain: 'example.com',
    });

    const app = await getApp(
      {
        argv: {
          host: 'http://localhost:9999',
        },
        origin: 'http://example.com',
      },
      {
        attributes: [
          'definition',
          'id',
          'OrganizationId',
          'sharedStyle',
          'coreStyle',
          'vapidPublicKey',
        ],
        raw: true,
      },
    );

    expect(app).toStrictEqual({
      definition: dbApp.definition,
      id: dbApp.id,
      OrganizationId: dbApp.OrganizationId,
      sharedStyle: dbApp.sharedStyle,
      coreStyle: dbApp.coreStyle,
      vapidPublicKey: dbApp.vapidPublicKey,
    });
  });
});

describe('getRemapperContext', () => {
  it('should return a message getter with the app context', async () => {
    await Organization.create({ id: 'test' });
    const app = await App.create({
      definition: '',
      vapidPrivateKey: '',
      vapidPublicKey: '',
      OrganizationId: 'test',
    });
    await AppMessages.create({
      AppId: app.id,
      language: 'nl',
      messages: { bye: 'Doei', hello: 'Hallo', word: 'Woord' },
    });
    await AppMessages.create({
      AppId: app.id,
      language: 'nl-nl',
      messages: { bye: 'Dag', hello: 'Hoi' },
    });
    await AppMessages.create({
      AppId: app.id,
      language: 'nl-nl-brabants',
      messages: { bye: 'Houdoe' },
    });
    const userInfo: UserInfo = {
      email: '',
      email_verified: true,
      picture: '',
      profile: '',
      name: '',
      sub: '',
    };

    const context = await getRemapperContext(app, 'nl-nl-brabants', userInfo);
    const word = context.getMessage({ id: 'word' });
    const hello = context.getMessage({ id: 'hello' });
    const bye = context.getMessage({ id: 'bye' });
    expect(context.userInfo).toBe(userInfo);

    expect(word.format()).toBe('Woord');
    expect(hello.format()).toBe('Hoi');
    expect(bye.format()).toBe('Houdoe');
  });
});
