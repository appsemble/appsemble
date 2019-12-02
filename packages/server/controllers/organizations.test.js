import jwt from 'jsonwebtoken';
import request from 'supertest';

import createServer from '../utils/createServer';
import testSchema from '../utils/test/testSchema';
import testToken from '../utils/test/testToken';
import truncate from '../utils/test/truncate';

describe('organization controller', () => {
  let BlockDefinition;
  let Organization;
  let OrganizationBlockStyle;
  let OrganizationInvite;
  let User;
  let EmailAuthorization;
  let db;
  let server;
  let token;
  let organizationId;

  beforeAll(async () => {
    db = await testSchema('organizations');

    server = await createServer({ db });
    ({
      BlockDefinition,
      EmailAuthorization,
      Organization,
      OrganizationBlockStyle,
      OrganizationInvite,
      User,
    } = db.models);
  }, 10e3);

  beforeEach(async () => {
    await truncate(db);
    organizationId = 'testorganization';
    token = await testToken(
      server,
      db,
      'organizations:read organizations:style organizations:write',
      organizationId,
    );
  });

  afterAll(async () => {
    await db.close();
  });

  it('should fetch an organization', async () => {
    const response = await request(server)
      .get('/api/organizations/testorganization')
      .set('Authorization', token);

    expect(response.body).toStrictEqual({
      id: 'testorganization',
      name: 'Test Organization',
      members: [
        {
          id: expect.any(Number),
          name: 'Test User',
          primaryEmail: 'test@example.com',
        },
      ],
      invites: [],
    });
  });

  it('should not fetch a non-existent organization', async () => {
    const response = await request(server)
      .get('/api/organizations/foo')
      .set('Authorization', token);

    expect(response.status).toStrictEqual(404);
  });

  it('should create a new organization', async () => {
    const { body: organization } = await request(server)
      .post('/api/organizations')
      .set('Authorization', token)
      .send({ id: 'foo', name: 'Foooo' });

    expect(organization).toStrictEqual({
      id: 'foo',
      name: 'Foooo',
      members: [
        {
          id: expect.any(Number),
          name: 'Test User',
          primaryEmail: 'test@example.com',
        },
      ],
      invites: [],
    });
  });

  it('should not create an organization with the same identifier', async () => {
    await request(server)
      .post('/api/organizations')
      .set('Authorization', token)
      .send({ id: 'foo', name: 'Foooo' });

    const response = await request(server)
      .post('/api/organizations')
      .set('Authorization', token)
      .send({ id: 'foo', name: 'Foooo' });

    expect(response.status).toStrictEqual(409);
  });

  it('should send an invite to an organization', async () => {
    const userB = await EmailAuthorization.create({ email: 'test2@example.com', verified: true });
    await userB.createUser({ primaryEmail: 'test2@example.com', name: 'John' });
    const response = await request(server)
      .post('/api/organizations/testorganization/invites')
      .set('Authorization', token)
      .send({ email: 'test2@example.com' });

    expect(response.body).toStrictEqual({
      id: expect.any(Number),
      name: 'John',
      primaryEmail: 'test2@example.com',
    });
  });

  it('should revoke an invite', async () => {
    await request(server)
      .post('/api/organizations/testorganization/invites')
      .set('Authorization', token)
      .send({ email: 'test2@example.com' });

    const response = await request(server)
      .delete('/api/organizations/testorganization/invites')
      .set('Authorization', token)
      .send({ email: 'test2@example.com' });

    expect(response.status).toStrictEqual(204);
  });

  it('should not revoke a non-existent invite', async () => {
    const response = await request(server)
      .delete('/api/organizations/testorganization/invites')
      .set('Authorization', token)
      .send({ email: 'test2@example.com' });

    expect(response.status).toStrictEqual(404);
  });

  it('should not revoke an invite for an organization you are not a member of', async () => {
    await Organization.create({ id: 'org' });
    const userB = await EmailAuthorization.create({ email: 'test2@example.com', verified: true });
    await userB.createUser({ primaryEmail: 'test2@example.com', name: 'John' });
    await OrganizationInvite.create({
      email: 'test2@example.com',
      key: 'abcde',
      OrganizationId: 'org',
    });
    const response = await request(server)
      .post('/api/organizations/org/invites')
      .set('Authorization', token)
      .send({ email: 'test2@example.com' });

    expect(response.status).toStrictEqual(403);
  });

  it('should not send an invite for non-existent organizations', async () => {
    const response = await request(server)
      .post('/api/organizations/doesnotexist/invites')
      .set('Authorization', token)
      .send({ email: 'test@example.com' });

    expect(response.status).toStrictEqual(404);
  });

  it('should not send an invite to an organization you are not a member of', async () => {
    await Organization.create({ id: 'org' });
    const userB = await EmailAuthorization.create({ email: 'test2@example.com', verified: true });
    await userB.createUser({ primaryEmail: 'test2@example.com', name: 'John' });
    const response = await request(server)
      .post('/api/organizations/org/invites')
      .set('Authorization', token)
      .send({ email: 'test2@example.com' });

    expect(response.status).toStrictEqual(403);
  });

  it('should not send an invite to members of an organization', async () => {
    const userB = await EmailAuthorization.create({ email: 'test2@example.com', verified: true });
    const { id } = await userB.createUser({ primaryEmail: 'test2@example.com', name: 'John' });
    const organization = await Organization.findByPk('testorganization');
    await organization.addUser(id);

    const response = await request(server)
      .post('/api/organizations/testorganization/invites')
      .set('Authorization', token)
      .send({ email: 'test2@example.com' });

    expect(response.status).toStrictEqual(409);
  });

  it('should resend an invitation', async () => {
    const userB = await EmailAuthorization.create({ email: 'test2@example.com', verified: true });
    await userB.createUser({ primaryEmail: 'test2@example.com', name: 'John' });

    await request(server)
      .post('/api/organizations/testorganization/invites')
      .set('Authorization', token)
      .send({ email: 'test2@example.com' });

    const response = await request(server)
      .post('/api/organizations/testorganization/invites/resend')
      .set('Authorization', token)
      .send({ email: 'test2@example.com' });

    expect(response.status).toStrictEqual(204);
  });

  it('should not resend an invitation to a member who has not been invited', async () => {
    const userB = await EmailAuthorization.create({ email: 'test2@example.com', verified: true });
    await userB.createUser({ primaryEmail: 'test2@example.com', name: 'John' });

    const response = await request(server)
      .post('/api/organizations/testorganization/invites/resend')
      .set('Authorization', token)
      .send({ email: 'test2@example.com' });

    expect(response.body).toStrictEqual({
      error: 'Not Found',
      message: 'This person was not invited previously.',
      statusCode: 404,
    });
  });

  it('should not resend an invitation for a non-existent organization', async () => {
    const response = await request(server)
      .post('/api/organizations/foo/invites/resend')
      .set('Authorization', token)
      .send({ email: 'test@example.com' });

    expect(response.body).toStrictEqual({
      error: 'Not Found',
      message: 'Organization not found.',
      statusCode: 404,
    });
  });

  it('should leave the organization if there are other members', async () => {
    const organization = await Organization.findByPk('testorganization');
    await organization.createUser();
    const userId = jwt.decode(token.substring(7)).user.id;

    const { status } = await request(server)
      .delete(`/api/organizations/testorganization/members/${userId}`)
      .set('Authorization', token);

    expect(status).toBe(204);
  });

  it('should remove other members from an organization', async () => {
    const organization = await Organization.findByPk('testorganization');
    const userB = await organization.createUser();

    const { status } = await request(server)
      .delete(`/api/organizations/testorganization/members/${userB.id}`)
      .set('Authorization', token);

    expect(status).toBe(204);
  });

  it('should not remove the only remaining member in an organization', async () => {
    const userId = jwt.decode(token.substring(7)).user.id;

    const response = await request(server)
      .delete(`/api/organizations/testorganization/members/${userId}`)
      .set('Authorization', token);

    expect(response.status).toStrictEqual(406);
  });

  it('should not remove non-members or non-existing users from an organization', async () => {
    const userB = await User.create();

    const { status: nonMember } = await request(server)
      .delete(`/api/organizations/testorganization/members/${userB.id}`)
      .set('Authorization', token);

    const { status: nonExisting } = await request(server)
      .delete('/api/organizations/testorganization/members/0')
      .set('Authorization', token);

    expect(nonMember).toBe(404);
    expect(nonExisting).toBe(404);
  });

  it('should validate and update shared stylesheets when uploading shared stylesheets for an organization', async () => {
    const responseA = await request(server)
      .post(`/api/organizations/${organizationId}/style/shared`)
      .set('Authorization', token)
      .attach('style', Buffer.from('body { color: red; }'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    expect(responseA.status).toBe(204);

    const responseB = await request(server).get(
      `/api/organizations/${organizationId}/style/shared`,
    );

    expect(responseB.status).toBe(200);
    expect(responseB.text).toStrictEqual('body { color: red; }');
  });

  it('should set shared stylesheets to null when uploading empty stylesheets for an organization', async () => {
    const responseA = await request(server)
      .post(`/api/organizations/${organizationId}/style/core`)
      .set('Authorization', token)
      .attach('style', Buffer.from('body { color: blue; }'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    const responseB = await request(server)
      .post(`/api/organizations/${organizationId}/style/shared`)
      .set('Authorization', token)
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
      .set('Authorization', token)
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
      .post('/api/organizations/test/style/shared')
      .set('Authorization', token)
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
      .set('Authorization', token)
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
      .set('Authorization', token)
      .attach('style', Buffer.from('body { color: blue; }'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    const responseB = await request(server)
      .post(`/api/organizations/${organizationId}/style/core`)
      .set('Authorization', token)
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
      .set('Authorization', token)
      .attach('style', Buffer.from('invalidCss'));
    expect(response.body).toStrictEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Provided CSS was invalid.',
    });
  });

  it('should not allow uploading core stylesheets to non-existant organizations', async () => {
    const response = await request(server)
      .post('/api/organizations/fake/style/core')
      .set('Authorization', token)
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
      .set('Authorization', token)
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
      .set('Authorization', token)
      .attach('style', Buffer.from('body { color: blue; }'), {
        contentType: 'text/css',
        filename: 'style.css',
      });

    const responseB = await request(server)
      .post(`/api/organizations/${organizationId}/style/block/@appsemble/testblock`)
      .set('Authorization', token)
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
      .set('Authorization', token)
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
      .post('/api/organizations/fake/style/block/@appsemble/testblock')
      .set('Authorization', token)
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
      .set('Authorization', token)
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
