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
                  type: 'string',
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

  it('should authorize positioning against the selected group, not the app-wide role', async () => {
    const { Group, GroupMember, Resource } = await getAppDB(app.id);
    // No app-wide update permission; the group Owner role grants it instead.
    await appMember.update({ role: PredefinedAppRole.Member });
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
    expect(response.status).toBe(200);
  });

  async function enforceOrderingGroupByBar(): Promise<void> {
    await app.update({
      definition: {
        ...app.definition,
        resources: {
          testResource: {
            ...app.definition.resources!.testResource,
            enforceOrderingGroupByFields: ['bar'],
          },
        },
      },
    });
  }

  it('should order a resource among the resources of its own ordering group', async () => {
    const { Resource } = await getAppDB(app.id);
    await enforceOrderingGroupByBar();
    await Resource.destroy({ where: { type: 'testResource' }, force: true });
    await Resource.bulkCreate([
      { type: 'testResource', data: { foo: 'first', bar: 'a' }, Position: 10 },
      { type: 'testResource', data: { foo: 'last', bar: 'a' }, Position: 20 },
      { type: 'testResource', data: { foo: 'moved', bar: 'a' }, Position: 30 },
      // Positions restart for every ordering group, so this resource shares the
      // position range of the resources above without being ordered against them.
      { type: 'testResource', data: { foo: 'other', bar: 'b' }, Position: 15 },
    ]);
    const moved = await Resource.findOne({ where: { type: 'testResource', Position: 30 } });

    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${moved!.id}/positions`,
      { prevResourcePosition: 10, nextResourcePosition: 20 },
    );
    expect(response.status).toBe(200);

    const orderingGroup = await request.get<{ foo: string }[]>(
      `/api/apps/${app.id}/resources/testResource?$filter=${encodeURIComponent(
        "bar eq 'a'",
      )}&$orderby=${encodeURIComponent('Position asc')}`,
    );
    expect(orderingGroup.data.map(({ foo }) => foo)).toStrictEqual(['first', 'moved', 'last']);
  });

  it('should treat a missing and a null ordering group field as the same ordering group', async () => {
    const { Resource } = await getAppDB(app.id);
    await enforceOrderingGroupByBar();
    await Resource.destroy({ where: { type: 'testResource' }, force: true });
    await Resource.bulkCreate([
      { type: 'testResource', data: { foo: 'first' }, Position: 10 },
      { type: 'testResource', data: { foo: 'last', bar: null }, Position: 20 },
      { type: 'testResource', data: { foo: 'moved' }, Position: 30 },
      { type: 'testResource', data: { foo: 'other', bar: 'a' }, Position: 17 },
    ]);
    const moved = await Resource.findOne({ where: { type: 'testResource', Position: 30 } });

    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${moved!.id}/positions`,
      { prevResourcePosition: 10, nextResourcePosition: 20 },
    );
    expect(response.status).toBe(200);

    const resources = await request.get<{ foo: string }[]>(
      `/api/apps/${app.id}/resources/testResource?$orderby=${encodeURIComponent('Position asc')}`,
    );
    expect(resources.data.map(({ foo }) => foo)).toStrictEqual(['first', 'moved', 'other', 'last']);
  });

  it('should place the moved resource between its neighbors when the positions are reset', async () => {
    const { Resource } = await getAppDB(app.id);
    await Resource.destroy({ where: { type: 'testResource' }, force: true });
    await Resource.bulkCreate([
      { type: 'testResource', data: { foo: 'first' }, Position: 1 },
      // 1 and 1 + Number.EPSILON are adjacent doubles, so their midpoint rounds back to 1 and the
      // resource can only be inserted between them by resetting the positions.
      { type: 'testResource', data: { foo: 'last' }, Position: 1 + Number.EPSILON },
      { type: 'testResource', data: { foo: 'moved' }, Position: 9 },
    ]);
    const moved = await Resource.findOne({ where: { type: 'testResource', Position: 9 } });

    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${moved!.id}/positions`,
      { prevResourcePosition: 1, nextResourcePosition: 1 + Number.EPSILON },
    );
    expect(response.status).toBe(200);

    const resources = await request.get<{ foo: string }[]>(
      `/api/apps/${app.id}/resources/testResource?$orderby=${encodeURIComponent('Position asc')}`,
    );
    expect(resources.data.map(({ foo }) => foo)).toStrictEqual(['first', 'moved', 'last']);
  });

  it('should reset the positions of the resources of the moved resource ordering group only', async () => {
    const { Resource } = await getAppDB(app.id);
    await enforceOrderingGroupByBar();
    await Resource.destroy({ where: { type: 'testResource' }, force: true });
    await Resource.bulkCreate([
      { type: 'testResource', data: { foo: 'first', bar: 'a' }, Position: 1 },
      { type: 'testResource', data: { foo: 'last', bar: 'a' }, Position: 1 + Number.EPSILON },
      { type: 'testResource', data: { foo: 'moved', bar: 'a' }, Position: 9 },
      { type: 'testResource', data: { foo: 'other first', bar: 'b' }, Position: 2 },
      { type: 'testResource', data: { foo: 'other last', bar: 'b' }, Position: 3 },
    ]);
    const moved = await Resource.findOne({ where: { type: 'testResource', Position: 9 } });

    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${moved!.id}/positions`,
      { prevResourcePosition: 1, nextResourcePosition: 1 + Number.EPSILON },
    );
    expect(response.status).toBe(200);

    const otherOrderingGroup = await request.get<{ foo: string; Position: string }[]>(
      `/api/apps/${app.id}/resources/testResource?$filter=${encodeURIComponent(
        "bar eq 'b'",
      )}&$orderby=${encodeURIComponent('Position asc')}`,
    );
    expect(
      otherOrderingGroup.data.map(({ Position, foo }) => [foo, Number(Position)]),
    ).toStrictEqual([
      ['other first', 2],
      ['other last', 3],
    ]);

    const orderingGroup = await request.get<{ foo: string }[]>(
      `/api/apps/${app.id}/resources/testResource?$filter=${encodeURIComponent(
        "bar eq 'a'",
      )}&$orderby=${encodeURIComponent('Position asc')}`,
    );
    expect(orderingGroup.data.map(({ foo }) => foo)).toStrictEqual(['first', 'moved', 'last']);
  });

  it('should reset the positions of the resources of the selected group only', async () => {
    const { Group, GroupMember, Resource } = await getAppDB(app.id);
    const { id: groupId } = await Group.create({ name: 'testGroup' });
    await GroupMember.create({
      GroupId: groupId,
      AppMemberId: appMember.id,
      role: PredefinedAppRole.Owner,
    });
    await Resource.destroy({ where: { type: 'testResource' }, force: true });
    await Resource.bulkCreate([
      { type: 'testResource', data: { foo: 'first' }, Position: 1, GroupId: groupId },
      {
        type: 'testResource',
        data: { foo: 'last' },
        Position: 1 + Number.EPSILON,
        GroupId: groupId,
      },
      { type: 'testResource', data: { foo: 'moved' }, Position: 9, GroupId: groupId },
      { type: 'testResource', data: { foo: 'ungrouped first' }, Position: 2 },
      { type: 'testResource', data: { foo: 'ungrouped last' }, Position: 3 },
    ]);
    const moved = await Resource.findOne({
      where: { type: 'testResource', GroupId: groupId, Position: 9 },
    });

    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${moved!.id}/positions?selectedGroupId=${groupId}`,
      { prevResourcePosition: 1, nextResourcePosition: 1 + Number.EPSILON },
    );
    expect(response.status).toBe(200);

    const ungrouped = await request.get<{ foo: string; Position: string }[]>(
      `/api/apps/${app.id}/resources/testResource?$orderby=${encodeURIComponent('Position asc')}`,
    );
    expect(ungrouped.data.map(({ Position, foo }) => [foo, Number(Position)])).toStrictEqual([
      ['ungrouped first', 2],
      ['ungrouped last', 3],
    ]);

    const grouped = await request.get<{ foo: string }[]>(
      `/api/apps/${app.id}/resources/testResource?selectedGroupId=${groupId}&$orderby=${encodeURIComponent(
        'Position asc',
      )}`,
    );
    expect(grouped.data.map(({ foo }) => foo)).toStrictEqual(['first', 'moved', 'last']);
  });

  it('should not reset the positions of seed resources in demo apps', async () => {
    const { Resource } = await getAppDB(app.id);
    await app.update({ demoMode: true });
    await Resource.destroy({ where: { type: 'testResource' }, force: true });
    await Resource.bulkCreate([
      { type: 'testResource', data: { foo: 'first' }, Position: 1, ephemeral: true },
      {
        type: 'testResource',
        data: { foo: 'last' },
        Position: 1 + Number.EPSILON,
        ephemeral: true,
      },
      { type: 'testResource', data: { foo: 'moved' }, Position: 9, ephemeral: true },
      { type: 'testResource', data: { foo: 'seed first' }, Position: 2, seed: true },
      { type: 'testResource', data: { foo: 'seed last' }, Position: 3, seed: true },
    ]);
    const moved = await Resource.findOne({
      where: { type: 'testResource', ephemeral: true, Position: 9 },
    });

    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${moved!.id}/positions`,
      { prevResourcePosition: 1, nextResourcePosition: 1 + Number.EPSILON },
    );
    expect(response.status).toBe(200);

    const seedResources = await Resource.findAll({
      where: { type: 'testResource', seed: true },
      order: [['Position', 'ASC']],
    });
    expect(seedResources.map(({ Position, data }) => [data.foo, Number(Position)])).toStrictEqual([
      ['seed first', 2],
      ['seed last', 3],
    ]);

    const ephemeralResources = await request.get<{ foo: string }[]>(
      `/api/apps/${app.id}/resources/testResource?$orderby=${encodeURIComponent('Position asc')}`,
    );
    expect(ephemeralResources.data.map(({ foo }) => foo)).toStrictEqual(['first', 'moved', 'last']);
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
