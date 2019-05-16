import validate from '@appsemble/utils/validate';
import RefParser from 'json-schema-ref-parser';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import createServer from '../utils/createServer';
import testSchema from '../utils/test/testSchema';
import testToken from '../utils/test/testToken';
import truncate from '../utils/test/truncate';
import templates from '../templates/apps';
import schema from '../api';

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
  let Resource;

  beforeAll(async () => {
    db = await testSchema('assets');

    server = await createServer({ db });
    ({ Resource } = db.models);
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
});
