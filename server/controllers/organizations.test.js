import request from 'supertest';

import createServer from '../utils/createServer';
import truncate from '../utils/test/truncate';
import testSchema from '../utils/test/testSchema';

describe('organization controller', () => {
  let BlockDefinition;
  let Organization;
  let OrganizationBlockStyle;
  let db;
  let server;
  let organizationId;

  beforeAll(async () => {
    db = await testSchema('organizations');

    server = await createServer({ db });
    ({ BlockDefinition, Organization, OrganizationBlockStyle } = db.models);
  });

  beforeEach(async () => {
    await truncate(db);
    ({ id: organizationId } = await Organization.create({ name: 'Test Organization A' }));
  });

  afterAll(async () => {
    await db.close();
  });

  it('should validate and update shared stylesheets when uploading shared stylesheets for an organization', async () => {
    const responseA = await request(server)
      .post(`/api/organizations/${organizationId}/style/shared`)
      .attach('style', Buffer.from('body { color: red; }'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    const responseB = await request(server).get(
      `/api/organizations/${organizationId}/style/shared`,
    );

    expect(responseA.status).toBe(204);
    expect(responseB.status).toBe(200);
    expect(responseB.text).toStrictEqual('body { color: red; }');
  });

  it('should set shared stylesheets to null when uploading empty stylesheets for an organization', async () => {
    const responseA = await request(server)
      .post(`/api/organizations/${organizationId}/style/core`)
      .attach('style', Buffer.from('body { color: blue; }'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    const responseB = await request(server)
      .post(`/api/organizations/${organizationId}/style/shared`)
      .attach('style', Buffer.from(' '), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    const organization = await Organization.findByPk(organizationId);

    expect(responseA.status).toBe(204);
    expect(responseB.status).toBe(204);
    expect(organization.sharedStyle).toBeNull();
  });

  it('should not allow invalid stylesheets when uploading shared stylesheets to an organization', async () => {
    const response = await request(server)
      .post(`/api/organizations/${organizationId}/style/shared`)
      .attach('style', Buffer.from('invalidCss'));
    expect(response.body).toStrictEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Provided CSS was invalid.',
    });
  });

  it('should return an empty response on non-existant shared stylesheets', async () => {
    const response = await request(server).get(`/api/organizations/${organizationId}/style/shared`);

    expect(response.text).toBe('');
    expect(response.type).toBe('text/css');
    expect(response.status).toBe(200);
  });

  it('should not allow uploading shared stylesheets to non-existant organizations', async () => {
    const response = await request(server)
      .post(`/api/organizations/0/style/shared`)
      .attach('style', Buffer.from('body { color: red; }'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    expect(response.body).toStrictEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Organization not found.',
    });
  });

  it('should validate and update core stylesheets when uploading core stylesheets for an organization', async () => {
    const responseA = await request(server)
      .post(`/api/organizations/${organizationId}/style/core`)
      .attach('style', Buffer.from('body { color: blue; }'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    const responseB = await request(server).get(`/api/organizations/${organizationId}/style/core`);

    expect(responseA.status).toBe(204);
    expect(responseB.status).toBe(200);
    expect(responseB.text).toStrictEqual('body { color: blue; }');
  });

  it('should set core stylesheets to null when uploading empty stylesheets for an organization', async () => {
    const responseA = await request(server)
      .post(`/api/organizations/${organizationId}/style/core`)
      .attach('style', Buffer.from('body { color: blue; }'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    const responseB = await request(server)
      .post(`/api/organizations/${organizationId}/style/core`)
      .attach('style', Buffer.from(' '), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    const organization = await Organization.findByPk(organizationId);

    expect(responseA.status).toBe(204);
    expect(responseB.status).toBe(204);
    expect(organization.coreStyle).toBeNull();
  });

  it('should not allow invalid stylesheets when uploading core stylesheets to an organization', async () => {
    const response = await request(server)
      .post(`/api/organizations/${organizationId}/style/core`)
      .attach('style', Buffer.from('invalidCss'));
    expect(response.body).toStrictEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Provided CSS was invalid.',
    });
  });

  it('should not allow uploading core stylesheets to non-existant organizations', async () => {
    const response = await request(server)
      .post(`/api/organizations/0/style/core`)
      .attach('style', Buffer.from('body { color: red; }'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    expect(response.body).toStrictEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Organization not found.',
    });
  });

  it('should return an empty response on non-existant core stylesheets', async () => {
    const response = await request(server).get(`/api/organizations/${organizationId}/style/core`);

    expect(response.text).toBe('');
    expect(response.type).toBe('text/css');
    expect(response.status).toBe(200);
  });

  it('should validate and update block stylesheets when uploading block stylesheets for an organization', async () => {
    await BlockDefinition.create({
      id: '@appsemble/testblock',
      description: 'This is a test block for testing purposes.',
    });

    const responseA = await request(server)
      .post(`/api/organizations/${organizationId}/style/block/@appsemble/testblock`)
      .attach('style', Buffer.from('body { color: blue; }'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    const responseB = await request(server).get(
      `/api/organizations/${organizationId}/style/block/@appsemble/testblock`,
    );

    expect(responseA.status).toBe(204);
    expect(responseB.status).toBe(200);
    expect(responseB.text).toStrictEqual('body { color: blue; }');
  });

  it('should set block stylesheets to null when uploading empty stylesheets for an organization', async () => {
    await BlockDefinition.create({
      id: '@appsemble/testblock',
      description: 'This is a test block for testing purposes.',
    });

    const responseA = await request(server)
      .post(`/api/organizations/${organizationId}/style/block/@appsemble/testblock`)
      .attach('style', Buffer.from('body { color: blue; }'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    const responseB = await request(server)
      .post(`/api/organizations/${organizationId}/style/block/@appsemble/testblock`)
      .attach('style', Buffer.from(' '), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    const style = await OrganizationBlockStyle.findOne({
      where: { OrganizationId: organizationId, BlockDefinitionId: '@appsemble/testblock' },
    });

    expect(responseA.status).toBe(204);
    expect(responseB.status).toBe(204);
    expect(style.style).toBeNull();
  });

  it('should not allow invalid stylesheets when uploading block stylesheets to an organization', async () => {
    await BlockDefinition.create({
      id: '@appsemble/testblock',
      description: 'This is a test block for testing purposes.',
    });

    const response = await request(server)
      .post(`/api/organizations/${organizationId}/style/block/@appsemble/testblock`)
      .attach('style', Buffer.from('invalidCss'));
    expect(response.body).toStrictEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Provided CSS was invalid.',
    });
  });

  it('should not allow uploading block stylesheets to non-existant organizations', async () => {
    await BlockDefinition.create({
      id: '@appsemble/testblock',
      description: 'This is a test block for testing purposes.',
    });

    const response = await request(server)
      .post(`/api/organizations/0/style/block/@appsemble/testblock`)
      .attach('style', Buffer.from('body { color: red; }'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    expect(response.body).toStrictEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Organization not found.',
    });
  });

  it('should not allow uploading block stylesheets for non-existant blocks', async () => {
    const response = await request(server)
      .post(`/api/organizations/${organizationId}/style/block/@appsemble/doesntexist`)
      .attach('style', Buffer.from('body { color: red; }'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    expect(response.body).toStrictEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Block not found.',
    });
  });

  it('should return an empty response on non-existant block stylesheets', async () => {
    const response = await request(server).get(
      `/api/organizations/${organizationId}/style/block/@appsemble/doesntexist`,
    );

    expect(response.text).toBe('');
    expect(response.type).toBe('text/css');
    expect(response.status).toBe(200);
  });
});
