import { PredefinedAppRole } from '@appsemble/lang-sdk';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { Op } from 'sequelize';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  type AppMember,
  getAppDB,
  Organization,
  OrganizationMember,
  type Resource,
  type User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import {
  authorizeAppMember,
  createTestAppMember,
  createTestUser,
} from '../../../utils/test/authorization.js';

let organization: Organization;
let user: User;
let app: App;
let appMember: AppMember;
let resource: Resource;

describe('updateResourcePosition', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer({});
    await setTestApp(server);
  });

  beforeEach(async () => {
    vi.useFakeTimers();
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
    app = await App.create({
      OrganizationId: organization.id,
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {},
        enforceOrderingGroupByFields: ['bar'],
        resources: {
          testResource: {
            positioning: true,
            schema: {
              type: 'object',
              required: ['foo'],
              properties: {
                foo: {
                  type: 'string',
                },
                bar: {
                  type: 'number',
                },
              },
            },
          },
        },
        pages: [],
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
    });
    appMember = await createTestAppMember(app.id, user.primaryEmail, PredefinedAppRole.Owner);

    const { Resource } = await getAppDB(app.id);
    resource = await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      Position: 4,
    });

    await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      Position: 1,
    });
    await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      Position: 2,
    });
    await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      Position: 3,
    });
  });

  it('should throw if the previous Position is greater than the next position', async () => {
    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${resource.id}/positions`,
      { prevResourcePosition: 2, nextResourcePosition: 1 },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Previous resource Position should be less than the next resource',
      },
    });
  });

  it('should throw if the resource does not exist', async () => {
    authorizeAppMember(app, appMember);
    const response = await request.put(`/api/apps/${app.id}/resources/testResource/10/positions`, {
      prevResourcePosition: 1,
      nextResourcePosition: 2,
    });
    expect(response).toMatchObject({
      status: 404,
      data: {
        statusCode: 404,
        error: 'Not Found',
        message: 'Resource not found',
      },
    });
  });

  it('should throw if the app member does not have sufficient permissions', async () => {
    await appMember.update({ role: PredefinedAppRole.Member });
    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${resource.id}/positions`,
      { prevResourcePosition: 1, nextResourcePosition: 2 },
    );
    expect(response).toMatchObject({
      status: 403,
      data: {
        statusCode: 403,
        error: 'Forbidden',
        message: 'App member does not have sufficient app permissions.',
      },
    });
  });

  it('should check if the position parameters are valid', async () => {
    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${resource.id}/positions`,
      { prevResourcePosition: 4, nextResourcePosition: 5 },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid previous or next resource Position',
      },
    });
  });

  it('should not allow inserting between two non adjacent resources', async () => {
    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${resource.id}/positions`,
      { prevResourcePosition: 1, nextResourcePosition: 3 },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid previous or next resource Position',
      },
    });
  });

  it('should not allow an invalid nextResourcePosition for inserting at the top', async () => {
    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${resource.id}/positions`,
      { nextResourcePosition: 2, prevResourcePosition: null },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid Position',
      },
    });
  });

  it('should not allow an invalid prevResourcePosition for inserting at the end', async () => {
    await resource.update({
      Position: 0,
    });

    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${resource.id}/positions`,
      { prevResourcePosition: 2, nextResourcePosition: null },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid Position',
      },
    });
  });

  it('should allow a valid prevResourcePosition for inserting at the end', async () => {
    await resource.update({ Position: 0 });
    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${resource.id}/positions`,
      { prevResourcePosition: 3, nextResourcePosition: null },
    );
    expect(response).toMatchObject({
      status: 200,
      data: expect.objectContaining({
        $created: expect.any(String),
        $updated: expect.any(String),
        id: resource.id,
        foo: 'I am Foo.',
        Position: String(3 * 1.1),
      }),
    });
  });

  it('should allow a valid nextResourcePosition for inserting at the top', async () => {
    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${resource.id}/positions`,
      { nextResourcePosition: 1, prevResourcePosition: null },
    );
    expect(response).toMatchObject({
      status: 200,
      data: expect.objectContaining({
        $created: expect.any(String),
        $updated: expect.any(String),
        id: resource.id,
        foo: 'I am Foo.',
        Position: '0.5',
      }),
    });
  });

  it('should support groups', async () => {
    const { Group, GroupMember, Resource } = await getAppDB(app.id);
    const { id: groupId } = await Group.create({ name: 'testGroup' });
    await GroupMember.create({
      GroupId: groupId,
      AppMemberId: appMember.id,
      role: PredefinedAppRole.Owner,
    });
    await Resource.destroy({ where: { type: 'testResource' }, force: true });
    await Resource.bulkCreate(
      [...Array.from({ length: 5 }).keys()].map((i) => ({
        data: { foo: `bar ${i}` },
        type: 'testResource',
        Position: i + 1,
        GroupId: groupId,
      })),
    );
    const resource2 = await Resource.findOne({
      where: { type: 'testResource', GroupId: groupId, Position: { [Op.gt]: 2 } },
    });
    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${resource2!.id}/positions?selectedGroupId=${groupId}`,
      { prevResourcePosition: 1, nextResourcePosition: 2 },
    );
    expect(response).toMatchObject({
      status: 200,
      data: {
        Position: '1.5',
        foo: 'bar 2',
        id: 7,
      },
    });
  });

  it('should update the position of the resource', async () => {
    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${resource.id}/positions`,
      { prevResourcePosition: 1, nextResourcePosition: 2 },
    );
    expect(response).toMatchObject({
      status: 200,
      data: {
        $created: expect.any(String),
        $updated: expect.any(String),
        Position: '1.5',
        id: resource.id,
        foo: 'I am Foo.',
      },
    });
  });
});
