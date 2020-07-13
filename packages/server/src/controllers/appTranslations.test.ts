import { request, setTestApp } from 'axios-test-instance';

import { App, AppTranslation, Member, Organization, User } from '../models';
import createServer from '../utils/createServer';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';
import testToken from '../utils/test/testToken';

let authorization: string;
let app: App;
let user: User;

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
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });
  app = await App.create({
    path: 'test-app',
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
    OrganizationId: 'testorganization',
    definition: {
      name: 'Test App',
      description: 'Description',
      pages: [],
    },
  });
});

afterEach(truncate);

afterAll(closeTestSchema);

describe('getTranslation', () => {
  it('should return an existing language', async () => {
    await request.post(`/api/apps/${app.id}/translations`, {
      language: 'en-gb',
      content: { test: 'Test.' },
    });

    const { data } = await request.get(`/api/apps/${app.id}/translations/en-GB`);
    expect(data).toMatchObject({ test: 'Test.' });
  });

  it('should return a 404 if a language is not supported', async () => {
    const { data } = await request.get(`/api/apps/${app.id}/translations/en-GB`);
    expect(data).toMatchObject({ statusCode: 404, message: 'Language could not be found' });
  });
});

describe('createTranslation', () => {
  it('should accept valid requests', async () => {
    const { status } = await request.post(`/api/apps/${app.id}/translations`, {
      language: 'en',
      content: { test: 'Test.' },
    });
    const translation = await AppTranslation.findOne({ where: { AppId: app.id, language: 'en' } });

    expect(translation.content).toMatchObject({ test: 'Test.' });
    expect(status).toBe(204);
  });
});

describe('getAppLanguages', () => {
  it('should return an empty array if no translations are available', async () => {
    const { data } = await request.get(`/api/apps/${app.id}/translations`, {
      headers: { authorization },
    });
    expect(data).toStrictEqual([]);
  });

  it('should return a list of available languages', async () => {
    await request.post(`/api/apps/${app.id}/translations`, {
      language: 'nl',
      content: { test: 'Geslaagd met vliegende kleuren' },
    });
    await request.post(`/api/apps/${app.id}/translations`, {
      language: 'en',
      content: { test: 'Passed with flying colors' },
    });
    await request.post(`/api/apps/${app.id}/translations`, {
      language: 'en-GB',
      content: { test: 'Passed with flying colours' },
    });

    const { data } = await request.get(`/api/apps/${app.id}/translations`, {
      headers: { authorization },
    });

    expect(data).toStrictEqual(['en', 'en-gb', 'nl']);
  });
});
