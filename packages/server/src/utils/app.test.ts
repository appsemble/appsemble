import { UserInfo } from '@appsemble/types';

import { App, AppMessages, Organization } from '../models';
import { compareApps, getApp, getRemapperContext } from './app';
import { setArgv } from './argv';
import { useTestDatabase } from './test/testSchema';

useTestDatabase('getapp');

beforeEach(async () => {
  await Organization.create({
    id: 'test-organization',
    name: 'Test Organization',
  });
});

describe('getApp', () => {
  beforeEach(() => {
    setArgv({
      host: 'http://localhost:9999',
    });
  });

  it('should resolve an app by its default domain', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'test-organization',
    });

    const result = await getApp(
      { origin: 'http://test-app.test-organization.localhost:9999' },
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

    expect(result).toStrictEqual({
      appPath: 'test-app',
      organizationId: 'test-organization',
      app: {
        definition: app.definition,
        id: app.id,
        OrganizationId: app.OrganizationId,
        sharedStyle: app.sharedStyle,
        coreStyle: app.coreStyle,
        vapidPublicKey: app.vapidPublicKey,
      },
    });
  });

  it('should allow passing an optional url parameter', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'test-organization',
    });

    const result = await getApp(
      { origin: 'http://localhost:9999' },
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

    expect(result).toStrictEqual({
      appPath: 'test-app',
      organizationId: 'test-organization',
      app: {
        definition: app.definition,
        id: app.id,
        OrganizationId: app.OrganizationId,
        sharedStyle: app.sharedStyle,
        coreStyle: app.coreStyle,
        vapidPublicKey: app.vapidPublicKey,
      },
    });
  });

  it('should resolve apps with custom domains', async () => {
    const app = await App.create({
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

    const result = await getApp(
      { origin: 'http://example.com' },
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

    expect(result).toStrictEqual({
      appPath: undefined,
      organizationId: undefined,
      app: {
        definition: app.definition,
        id: app.id,
        OrganizationId: app.OrganizationId,
        sharedStyle: app.sharedStyle,
        coreStyle: app.coreStyle,
        vapidPublicKey: app.vapidPublicKey,
      },
    });
  });

  it('should resolve if no app is found', async () => {
    const result = await getApp({ origin: 'http://my-app.my-org.localhost' }, {});

    expect(result).toStrictEqual({
      appPath: 'my-app',
      organizationId: 'my-org',
      app: null,
    });
  });

  it('should resolve if a URL only matches an organization id', async () => {
    const result = await getApp({ origin: 'http://my-org.localhost' }, {});

    expect(result).toStrictEqual({
      appPath: undefined,
      organizationId: 'my-org',
      app: undefined,
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
      messages: { messageIds: { bye: 'Doei', hello: 'Hallo', word: 'Woord' } },
    });
    await AppMessages.create({
      AppId: app.id,
      language: 'nl-nl',
      messages: { messageIds: { bye: 'Dag', hello: 'Hoi' } },
    });
    await AppMessages.create({
      AppId: app.id,
      language: 'nl-nl-brabants',
      messages: { messageIds: { bye: 'Houdoe' } },
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
    const nothing = context.getMessage({ id: 'nothing' });

    expect(context.userInfo).toBe(userInfo);
    expect(word.format()).toBe('Woord');
    expect(hello.format()).toBe('Hoi');
    expect(bye.format()).toBe('Houdoe');
    expect(nothing.format()).toBe('{nothing}');
  });
});

describe('sortApps', () => {
  it('should sort apps by their app rating in descending order and with no ratings last', () => {
    const apps: Partial<App>[] = [
      {
        id: 2,
        RatingAverage: 5,
        RatingCount: 1,
      },
      {
        id: 1,
        RatingAverage: 5,
        RatingCount: 2,
      },
      {
        id: 4,
      },
      {
        id: 5,
      },
      {
        id: 3,
        RatingAverage: 3,
        RatingCount: 2,
      },
    ];
    const [b, a, d, e, c] = apps;

    expect(apps.sort(compareApps)).toMatchObject([a, b, c, d, e]);
  });
});
