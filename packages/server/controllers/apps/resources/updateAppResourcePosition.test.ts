import { PredefinedAppRole, PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type App,
  type AppMember,
  Organization,
  OrganizationMember,
  Resource,
  type User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import {
  authorizeAppMember,
  createTestAppMember,
  createTestUser,
} from '../../../utils/test/authorization.js';
import { exampleApp } from '../../../utils/test/exampleApp.js';

let organization: Organization;
let user: User;
let app: App;
let appMember: AppMember;

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
    app = await exampleApp(organization.id);
    appMember = await createTestAppMember(app.id, user.primaryEmail, PredefinedAppRole.Owner);
  });

  it('should throw if the previous Position is greater than the next position', async () => {
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 4,
    });

    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 1,
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 2,
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 3,
    });
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
        message: 'Previous resource position should be less than the next resource',
      },
    });
  });

  it('should throw if the resource does not exist', async () => {
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 4,
    });

    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 1,
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 2,
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 3,
    });
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
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 4,
    });

    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 1,
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 2,
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 3,
    });
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
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 4,
    });

    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 1,
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 2,
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 3,
    });
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
        message: 'Invalid previous or next resource position',
      },
    });
  });

  it('should not allow inserting between two non adjacent resources', async () => {
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 4,
    });

    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 1,
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 2,
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 3,
    });
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
        message: 'Invalid previous or next resource position',
      },
    });
  });

  it('should not allow an invalid nextResourcePosition for inserting at the top', async () => {
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 4,
    });

    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 1,
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 2,
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 3,
    });
    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${resource.id}/positions`,
      { nextResourcePosition: 2 },
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
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 0,
    });

    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 1,
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 2,
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 3,
    });
    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${resource.id}/positions`,
      { prevResourcePosition: 2 },
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
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 0,
    });

    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 1,
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 2,
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 3,
    });
    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${resource.id}/positions`,
      { prevResourcePosition: 3 },
    );
    expect(response).toMatchObject({
      status: 200,
      data: {
        id: resource.id,
        foo: 'I am Foo.',
        position: 3 * 1.1,
      },
    });
  });

  it('should allow a valid nextResourcePosition for inserting at the top', async () => {
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 4,
    });

    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 1,
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 2,
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 3,
    });
    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${resource.id}/positions`,
      { nextResourcePosition: 1 },
    );
    expect(response).toMatchObject({
      status: 200,
      data: {
        id: resource.id,
        foo: 'I am Foo.',
        position: 0.5,
      },
    });
  });

  it('should update the position of the resource', async () => {
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 4,
    });

    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 1,
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 2,
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      position: 3,
    });
    authorizeAppMember(app, appMember);
    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource/${resource.id}/positions`,
      { prevResourcePosition: 1, nextResourcePosition: 2 },
    );
    expect(response).toMatchObject({
      status: 200,
      data: {
        position: 1.5,
        id: resource.id,
        foo: 'I am Foo.',
      },
    });
  });
});
