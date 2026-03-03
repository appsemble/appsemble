import { PredefinedAppRole } from '@appsemble/lang-sdk';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  type AppMember,
  getAppDB,
  Organization,
  OrganizationMember,
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
let sourceGroupId: number;
let targetGroupId: number;

describe('updateAppResourceGroup', () => {
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
            schema: {
              type: 'object',
              required: ['foo'],
              properties: {
                foo: {
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

    const { Group, GroupMember } = await getAppDB(app.id);
    const sourceGroup = await Group.create({ name: 'sourceGroup' });
    const targetGroup = await Group.create({ name: 'targetGroup' });
    sourceGroupId = sourceGroup.id;
    targetGroupId = targetGroup.id;

    await GroupMember.create({
      GroupId: sourceGroupId,
      AppMemberId: appMember.id,
      role: PredefinedAppRole.Owner,
    });
    await GroupMember.create({
      GroupId: targetGroupId,
      AppMemberId: appMember.id,
      role: PredefinedAppRole.Owner,
    });
  });

  it('should throw if the app does not exist', async () => {
    authorizeAppMember(app, appMember);
    const response = await request.put(`/api/apps/123/resources/testResource/1/group`, {
      groupId: 1,
    });
    expect(response).toMatchObject({
      status: 404,
      data: { message: 'App not found' },
    });
  });

  it('should throw if the resource does not exist', async () => {
    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/999/group?selectedGroupId=${sourceGroupId}`,
      { groupId: targetGroupId },
    );
    expect(response).toMatchObject({
      status: 404,
      data: { message: 'Resource not found' },
    });
  });

  it('should throw if the app member does not have sufficient permissions to delete from source group', async () => {
    const { GroupMember, Resource } = await getAppDB(app.id);

    await GroupMember.update(
      { role: PredefinedAppRole.Member },
      { where: { GroupId: sourceGroupId, AppMemberId: appMember.id } },
    );

    const groupResource = await Resource.create({
      type: 'testResource',
      data: { foo: 'bar' },
      GroupId: sourceGroupId,
    });

    await appMember.update({ role: PredefinedAppRole.Member });
    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${groupResource.id}/group?selectedGroupId=${sourceGroupId}`,
      { groupId: targetGroupId },
    );
    expect(response).toMatchObject({
      status: 403,
      data: { message: 'App member does not have sufficient app permissions.' },
    });
  });

  it('should throw if the app member does not have sufficient permissions to create in target group', async () => {
    const { GroupMember, Resource } = await getAppDB(app.id);

    await GroupMember.update(
      { role: PredefinedAppRole.Member },
      { where: { GroupId: targetGroupId, AppMemberId: appMember.id } },
    );

    const groupResource = await Resource.create({
      type: 'testResource',
      data: { foo: 'bar' },
      GroupId: sourceGroupId,
    });

    await appMember.update({ role: PredefinedAppRole.Member });
    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${groupResource.id}/group?selectedGroupId=${sourceGroupId}`,
      { groupId: targetGroupId },
    );
    expect(response).toMatchObject({
      status: 403,
      data: { message: 'App member does not have sufficient app permissions.' },
    });
  });

  it('should move a resource from one group to another', async () => {
    const { Resource } = await getAppDB(app.id);

    const groupResource = await Resource.create({
      type: 'testResource',
      data: { foo: 'bar' },
      GroupId: sourceGroupId,
    });

    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${groupResource.id}/group?selectedGroupId=${sourceGroupId}`,
      { groupId: targetGroupId },
    );
    expect(response.status).toBe(200);

    const updatedResource = await Resource.findByPk(groupResource.id);
    expect(updatedResource?.GroupId).toBe(targetGroupId);
  });

  it('should allow own:delete permission when the app member is the author of the resource', async () => {
    const customAppDefinition = {
      ...app.definition,
      security: {
        default: { role: 'member' },
        roles: {
          member: {
            permissions: ['$resource:testResource:own:delete', '$resource:testResource:create'],
          },
        },
      },
    };
    await app.update({ definition: customAppDefinition });
    await appMember.update({ role: 'member' });

    const { GroupMember, Resource } = await getAppDB(app.id);

    await GroupMember.update(
      { role: 'member' },
      { where: { GroupId: sourceGroupId, AppMemberId: appMember.id } },
    );
    await GroupMember.update(
      { role: 'member' },
      { where: { GroupId: targetGroupId, AppMemberId: appMember.id } },
    );

    const authoredResource = await Resource.create({
      type: 'testResource',
      data: { foo: 'bar' },
      GroupId: sourceGroupId,
      AuthorId: appMember.id,
    });

    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${authoredResource.id}/group?selectedGroupId=${sourceGroupId}`,
      { groupId: targetGroupId },
    );
    expect(response.status).toBe(200);

    const updatedResource = await Resource.findByPk(authoredResource.id);
    expect(updatedResource?.GroupId).toBe(targetGroupId);
  });

  it('should not allow own:delete permission when the app member is not the author of the resource', async () => {
    const customAppDefinition = {
      ...app.definition,
      security: {
        default: { role: 'member' },
        roles: {
          member: {
            permissions: ['$resource:testResource:own:delete', '$resource:testResource:create'],
          },
        },
      },
    };
    await app.update({ definition: customAppDefinition });
    await appMember.update({ role: 'member' });

    const { GroupMember, Resource } = await getAppDB(app.id);

    await GroupMember.update(
      { role: 'member' },
      { where: { GroupId: sourceGroupId, AppMemberId: appMember.id } },
    );
    await GroupMember.update(
      { role: 'member' },
      { where: { GroupId: targetGroupId, AppMemberId: appMember.id } },
    );

    const notAuthoredResource = await Resource.create({
      type: 'testResource',
      data: { foo: 'bar' },
      GroupId: sourceGroupId,
    });

    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${notAuthoredResource.id}/group?selectedGroupId=${sourceGroupId}`,
      { groupId: targetGroupId },
    );
    expect(response).toMatchObject({
      status: 403,
      data: { message: 'App member does not have sufficient app permissions.' },
    });
  });
});
