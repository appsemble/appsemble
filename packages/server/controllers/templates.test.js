import { validate } from '@appsemble/utils';
import RefParser from 'json-schema-ref-parser';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import schema from '../api';
import templates from '../templates/apps';
import createServer from '../utils/createServer';
import testSchema from '../utils/test/testSchema';
import testToken from '../utils/test/testToken';
import truncate from '../utils/test/truncate';

describe('App Templates', () => {
  templates.map(template =>
    it(`should validate ${template.name}`, async () => {
      const spec = await RefParser.dereference(schema());
      const appSchema = spec.components.schemas.App;
      const result = await validate(appSchema, template.definition);
      expect(result).toBeUndefined();
    }),
  );
});

describe('Template API', () => {
  let db;
  let server;
  let token;
  let organizationId;
  let App;
  let Resource;

  beforeAll(async () => {
    db = await testSchema('assets');

    server = await createServer({ db });
    ({ App, Resource } = db.models);
  }, 10e3);

  beforeEach(async () => {
    await truncate(db);
    token = await testToken(request, server, db, 'apps:read apps:write');
    organizationId = jwt.decode(token.substring(7)).user.organizations[0].id;
  });

  afterAll(async () => {
    await db.close();
  });

  it('should return a list of available templates', async () => {
    const { body: result } = await request(server).get('/api/templates');
    const expected = templates.map(({ name, description, resources }) => ({
      name,
      description,
      resources: !!resources,
    }));

    expect(result).toStrictEqual(expected);
  });

  it('should create a new app using a template', async () => {
    const { body: result } = await request(server)
      .post('/api/templates')
      .set('Authorization', token)
      .send({
        template: templates[0].name,
        name: 'Test app',
        description: 'This is a test app',
        organizationId,
      });

    expect(result).toMatchSnapshot();
  });

  it('should create a new app with example resources', async () => {
    const template = templates.find(t => t.name === 'Person App');
    const { body: result } = await request(server)
      .post('/api/templates')
      .set('Authorization', token)
      .send({
        template: template.name,
        name: 'Test app',
        description: 'This is a test app',
        organizationId,
        resources: true,
      });

    const { id } = result;
    const resources = await Resource.findAll(
      { where: { AppId: id, type: 'person' } },
      { raw: true },
    );

    expect(resources.map(r => r.data)).toStrictEqual(
      expect.arrayContaining(template.resources.person),
    );
  });

  it('should append a number when creating a new app using a template with a duplicate name', async () => {
    await request(server)
      .post('/api/templates')
      .set('Authorization', token)
      .send({
        template: templates[0].name,
        name: 'Test app',
        description: 'This is a test app',
        organizationId,
      });

    const {
      status,
      body: { id },
    } = await request(server)
      .post('/api/templates')
      .set('Authorization', token)
      .send({
        template: templates[0].name,
        name: 'Test app',
        description: 'This is a test app',
        organizationId,
      });
    const { body: settings } = await request(server).get(`/api/apps/${id}/settings`);

    expect(status).toStrictEqual(201);
    expect(settings.path).toStrictEqual('test-app-2');
  });

  it('should fall back to append random bytes to the end of the app path after 10 attempts', async () => {
    for (let i = 1; i < 11; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await App.create(
        {
          path: i === 1 ? 'test-app' : `test-app-${i}`,
          definition: { name: 'Test App', defaultPage: 'Test Page' },
          OrganizationId: organizationId,
        },
        { raw: true },
      );
    }

    const {
      status,
      body: { id },
    } = await request(server)
      .post('/api/templates')
      .set('Authorization', token)
      .send({
        template: templates[0].name,
        name: 'Test app',
        description: 'This is a test app',
        organizationId,
      });

    const { body: settings } = await request(server).get(`/api/apps/${id}/settings`);

    expect(status).toStrictEqual(201);
    const regex = /test-app-(\w){10}/;
    expect(regex.test(settings.path)).toBe(true);
  });
});
