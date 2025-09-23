import { readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  getAppDB,
  type Group,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';

let organization: Organization;
let server: Koa;
let user: User;
let app: App;
let group: Group;

describe('resendGroupInvite', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test' });
    server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(0);
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
      icon: await readFixture('nodejs-logo.png'),
    });
    app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'User',
            policy: 'invite',
          },
          roles: {
            User: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const { Group } = await getAppDB(app.id);
    group = await Group.create({
      name: 'Test Group',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
    vi.spyOn(server.context.mailer, 'sendTranslatedEmail');
  });

  it('should resend an invitation', async () => {
    const { GroupInvite } = await getAppDB(app.id);
    await GroupInvite.create({
      GroupId: group.id,
      email: 'test@example.com',
      key: 'test-key',
      role: 'User',
    });

    authorizeStudio();

    const response = await request.post(`/api/apps/${app.id}/groups/${group.id}/invites/resend`, {
      email: 'test@example.com',
    });

    expect(response).toMatchObject({ status: 204 });
    expect(server.context.mailer.sendTranslatedEmail).toHaveBeenCalledWith({
      emailName: 'groupInvite',
      locale: null,
      to: {
        email: 'test@example.com',
        name: 'Test User',
      },
      values: {
        appName: 'Test App',
        link: expect.any(Function),
        groupName: 'Test Group',
        name: 'Test User',
      },
    });
  });

  it('should not resend an invitation if the user does not have the right permissions', async () => {
    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.AppTranslator },
      { where: { UserId: user.id } },
    );

    const { GroupInvite } = await getAppDB(app.id);
    await GroupInvite.create({
      GroupId: group.id,
      email: 'test@example.com',
      key: 'test-key',
      role: 'User',
    });

    authorizeStudio();

    const response = await request.post(`/api/apps/${app.id}/groups/${group.id}/invites/resend`, {
      email: 'test@example.com',
    });

    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'User does not have sufficient organization permissions.',
        statusCode: 403,
      },
    });
    expect(server.context.mailer.sendTranslatedEmail).not.toHaveBeenCalled();
  });

  it('should not resend an invitation to a member who has not been invited', async () => {
    authorizeStudio();

    const response = await request.post(`/api/apps/${app.id}/groups/${group.id}/invites/resend`, {
      email: 'unininvited@example.com',
    });

    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'This person was not invited previously.',
        statusCode: 404,
      },
    });
    expect(server.context.mailer.sendTranslatedEmail).not.toHaveBeenCalled();
  });

  it('should not resend an invitation for a non-existent group', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/groups/1000/invites/resend`, {
      email: 'test@example.com',
    });

    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'Group not found.',
        statusCode: 404,
      },
    });
    expect(server.context.mailer.sendTranslatedEmail).not.toHaveBeenCalled();
  });
});
