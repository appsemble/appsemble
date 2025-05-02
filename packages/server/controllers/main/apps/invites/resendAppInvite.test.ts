import { readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppInvite,
  Organization,
  OrganizationMember,
  User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';

let organization: Organization;
let server: Koa;
let user: User;
let app: App;

describe('resendAppInvite', () => {
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
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
    vi.spyOn(server.context.mailer, 'sendTranslatedEmail');
  });

  it('should resend an invitation', async () => {
    await AppInvite.create({
      AppId: app.id,
      email: 'test@example.com',
      key: 'test-key',
      role: 'User',
    });

    authorizeStudio();

    const response = await request.post(`/api/apps/${app.id}/invites/resend`, {
      email: 'test@example.com',
    });

    expect(response).toMatchObject({ status: 204 });
    expect(server.context.mailer.sendTranslatedEmail).toHaveBeenCalledWith({
      emailName: 'appInvite',
      to: {
        email: 'test@example.com',
      },
      values: {
        appName: 'Test App',
        link: expect.any(Function),
        name: 'null',
      },
    });
  });

  it('should resend an invitation with the default app language if present', async () => {
    app = await app.update({ definition: { ...app.definition, defaultLanguage: 'nl' } });

    await AppInvite.create({
      AppId: app.id,
      email: 'test@example.com',
      key: 'test-key',
      role: 'User',
    });

    authorizeStudio();

    const response = await request.post(`/api/apps/${app.id}/invites/resend`, {
      email: 'test@example.com',
    });

    expect(response).toMatchObject({ status: 204 });
    expect(server.context.mailer.sendTranslatedEmail).toHaveBeenCalledWith({
      emailName: 'appInvite',
      to: {
        email: 'test@example.com',
      },
      locale: 'nl',
      values: {
        appName: 'Test App',
        link: expect.any(Function),
        name: 'null',
      },
    });
  });

  it('should resend an invitation with the locale of the user', async () => {
    const newUser = await User.create({
      primaryEmail: 'newuser@example.com',
      locale: 'en',
      timezone: 'Europe/Amsterdam',
      name: 'John Doe',
    });

    await AppInvite.create({
      AppId: app.id,
      email: newUser.primaryEmail,
      key: 'test-key',
      role: 'User',
      UserId: newUser.id,
    });

    authorizeStudio();

    const response = await request.post(`/api/apps/${app.id}/invites/resend`, {
      email: newUser.primaryEmail,
    });

    expect(response).toMatchObject({ status: 204 });
    expect(server.context.mailer.sendTranslatedEmail).toHaveBeenCalledWith({
      emailName: 'appInvite',
      to: {
        email: newUser.primaryEmail,
        name: 'John Doe',
      },
      locale: 'en',
      values: {
        appName: 'Test App',
        link: expect.any(Function),
        name: 'John Doe',
      },
    });
  });

  it('should resend an invitation prioritizing the locale of the user', async () => {
    app = await app.update({ definition: { ...app.definition, defaultLanguage: 'nl' } });

    const newUser = await User.create({
      primaryEmail: 'newuser@example.com',
      locale: 'en',
      timezone: 'Europe/Amsterdam',
      name: 'John Doe',
    });

    await AppInvite.create({
      AppId: app.id,
      email: newUser.primaryEmail,
      key: 'test-key',
      role: 'User',
      UserId: newUser.id,
    });

    authorizeStudio();

    const response = await request.post(`/api/apps/${app.id}/invites/resend`, {
      email: newUser.primaryEmail,
    });

    expect(response).toMatchObject({ status: 204 });
    expect(server.context.mailer.sendTranslatedEmail).toHaveBeenCalledWith({
      emailName: 'appInvite',
      to: {
        email: newUser.primaryEmail,
        name: 'John Doe',
      },
      locale: 'en',
      values: {
        appName: 'Test App',
        link: expect.any(Function),
        name: 'John Doe',
      },
    });
  });

  it('should not resend an invitation if the user does not have the right permissions', async () => {
    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.AppTranslator },
      { where: { UserId: user.id } },
    );

    await AppInvite.create({
      AppId: app.id,
      email: 'test@example.com',
      key: 'test-key',
      role: 'User',
    });

    authorizeStudio();

    const response = await request.post(`/api/apps/${app.id}/invites/resend`, {
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

    const response = await request.post(`/api/apps/${app.id}/invites/resend`, {
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

  it('should not resend an invitation for a non-existent app', async () => {
    authorizeStudio();
    const response = await request.post('/api/apps/1000/invites/resend', {
      email: 'test@example.com',
    });

    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'App not found.',
        statusCode: 404,
      },
    });
    expect(server.context.mailer.sendTranslatedEmail).not.toHaveBeenCalled();
  });
});
