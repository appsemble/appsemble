import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { App, type AppMember, getAppDB, Organization } from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeAppMember, createTestAppMember } from '../../../../utils/test/authorization.js';

let organization: Organization;
let app: App;
let member: AppMember;
let server: Koa;

describe('deleteCurrentAppMemberUnverifiedEmail', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    organization = await Organization.create({ name: 'Appsemble', id: 'appsemble' });
    app = await App.create({
      definition: {
        name: 'Test App',
        pages: [{ name: 'Test Page', blocks: [] }],
      },
      OrganizationId: organization.id,
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      path: 'test-app',
    });
    member = await createTestAppMember(app.id);
  });

  it('should throw if the email is not passed as query param', async () => {
    authorizeAppMember(app, member);
    const response = await request.delete(`/api/apps/${app.id}/auth/email/unverified`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "errors": [
          {
            "argument": "email",
            "instance": {},
            "message": "requires property "email"",
            "name": "required",
            "path": [],
            "property": "instance",
            "schema": {
              "additionalProperties": true,
              "properties": {
                "email": {
                  "type": "string",
                },
              },
              "required": [
                "email",
              ],
              "type": "object",
            },
            "stack": "instance requires property "email"",
          },
        ],
        "message": "Query parameter validation failed",
      }
    `);
  });

  it('should throw for unregistered emails', async () => {
    authorizeAppMember(app, member);
    const response = await request.delete(
      `/api/apps/${app.id}/auth/email/unverified?email=test@example22.com`,
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Email not registered",
        "statusCode": 404,
      }
    `);
  });

  it('should throw for non existing apps', async () => {
    authorizeAppMember(app, member);
    const { AppMemberEmailAuthorization } = await getAppDB(app.id);
    await AppMemberEmailAuthorization.create({
      email: 'test22@example.com',
      key: 'random-key',
      verified: false,
      AppMemberId: member.id,
      AppId: app.id,
    });
    const response = await request.delete(
      `/api/apps/${app.id + 5}/auth/email/unverified?email=test22@example.com`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App not found",
        "statusCode": 404,
      }
    `);
  });

  it('should delete a valid Email authorization', async () => {
    authorizeAppMember(app, member);
    const { AppMemberEmailAuthorization } = await getAppDB(app.id);
    await AppMemberEmailAuthorization.create({
      email: 'test22@example.com',
      key: 'random-key',
      verified: false,
      AppMemberId: member.id,
      AppId: app.id,
    });

    const emailAuthReq = await AppMemberEmailAuthorization.findByPk(member.id);
    expect(emailAuthReq?.dataValues).not.toBeNull();

    const response = await request.delete(
      `/api/apps/${app.id}/auth/email/unverified?email=test22@example.com`,
    );
    expect(response.status).toBe(204);

    const emailAuth = await AppMemberEmailAuthorization.findByPk(member.id);
    expect(emailAuth).toBeNull();
  });
});
