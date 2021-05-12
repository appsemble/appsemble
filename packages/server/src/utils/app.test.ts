import { UserInfo } from '@appsemble/types';

import { App, AppMessages, Organization } from '../models';
import { getApp, getRemapperContext, sortApps } from './app';
import { setArgv } from './argv';
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
  beforeEach(() => {
    setArgv({
      host: 'http://localhost:9999',
    });
  });

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
    expect(context.userInfo).toBe(userInfo);

    expect(word.format()).toBe('Woord');
    expect(hello.format()).toBe('Hoi');
    expect(bye.format()).toBe('Houdoe');
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

    expect(apps.sort(sortApps)).toMatchObject([a, b, c, d, e]);
  });
});
