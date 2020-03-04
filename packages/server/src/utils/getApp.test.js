import getApp from './getApp';
import testSchema from './test/testSchema';
import truncate from './test/truncate';

let db;
let dbApp;

beforeAll(async () => {
  db = await testSchema('getApp');
});

beforeEach(async () => {
  await truncate(db);
  await db.models.Organization.create({
    id: 'test-organization',
    name: 'Test Organization',
  });
});

afterAll(async () => {
  await db.close();
});

describe('getApp', () => {
  it('should resolve an app by its default domain', async () => {
    dbApp = await db.models.App.create({
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
        db,
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
    dbApp = await db.models.App.create({
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
        db,
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
    dbApp = await db.models.App.create({
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
        db,
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
