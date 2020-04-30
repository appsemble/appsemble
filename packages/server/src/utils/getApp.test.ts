import { App, Organization } from '../models';
import getApp from './getApp';
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
          'style',
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
      style: dbApp.style,
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
          'style',
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
      style: dbApp.style,
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
          'style',
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
      style: dbApp.style,
      vapidPublicKey: dbApp.vapidPublicKey,
    });
  });
});
