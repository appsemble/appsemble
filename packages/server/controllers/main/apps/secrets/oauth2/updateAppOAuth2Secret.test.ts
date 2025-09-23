import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, getAppDB, Organization, OrganizationMember } from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';

let app: App;
let member: OrganizationMember;

describe('updateAppOAuth2Secret', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(() => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(0);
  });

  beforeEach(async () => {
    const user = await createTestUser();
    const organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    app = await App.create({
      OrganizationId: organization.id,
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {
        security: {
          default: {
            role: 'Test',
            policy: 'everyone',
          },
          roles: { Test: {} },
        },
      },
    });
    member = await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
  afterAll(() => {
    vi.useRealTimers();
  });

  it('should update an OAuth2 secret', async () => {
    const { AppOAuth2Secret } = await getAppDB(app.id);
    const secret = await AppOAuth2Secret.create({
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/secrets/oauth2/${secret.id}`, {
      authorizationUrl: 'https://other.example/oauth/authorize',
      clientId: 'other_client_id',
      clientSecret: 'example_client_secret',
      icon: 'updated',
      name: 'Updated Example',
      scope: 'custom',
      tokenUrl: 'https://other.example/oauth/token',
      userInfoUrl: 'https://other.example/oauth/userinfo',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "authorizationUrl": "https://other.example/oauth/authorize",
        "clientId": "other_client_id",
        "clientSecret": "example_client_secret",
        "created": "1970-01-01T00:00:00.000Z",
        "icon": "updated",
        "id": 1,
        "name": "Updated Example",
        "remapper": null,
        "scope": "custom",
        "tokenUrl": "https://other.example/oauth/token",
        "updated": "1970-01-01T00:00:00.000Z",
        "userInfoUrl": "https://other.example/oauth/userinfo",
      }
    `);
    await secret.reload();
    expect(secret).toMatchObject({
      authorizationUrl: 'https://other.example/oauth/authorize',
      clientId: 'other_client_id',
      clientSecret: 'example_client_secret',
      icon: 'updated',
      name: 'Updated Example',
      scope: 'custom',
      tokenUrl: 'https://other.example/oauth/token',
      userInfoUrl: 'https://other.example/oauth/userinfo',
    });
  });

  it('should update AppOAuth2Secret.userInfoUrl to be null when undefined', async () => {
    const { AppOAuth2Secret } = await getAppDB(app.id);
    const secret = await AppOAuth2Secret.create({
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/secrets/oauth2/${secret.id}`, {
      authorizationUrl: 'https://other.example/oauth/authorize',
      clientId: 'other_client_id',
      clientSecret: 'example_client_secret',
      icon: 'updated',
      name: 'Updated Example',
      scope: 'custom',
      tokenUrl: 'https://other.example/oauth/token',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "authorizationUrl": "https://other.example/oauth/authorize",
        "clientId": "other_client_id",
        "clientSecret": "example_client_secret",
        "created": "1970-01-01T00:00:00.000Z",
        "icon": "updated",
        "id": 1,
        "name": "Updated Example",
        "remapper": null,
        "scope": "custom",
        "tokenUrl": "https://other.example/oauth/token",
        "updated": "1970-01-01T00:00:00.000Z",
        "userInfoUrl": null,
      }
    `);
    await secret.reload();
    expect(secret).toMatchObject({
      authorizationUrl: 'https://other.example/oauth/authorize',
      clientId: 'other_client_id',
      clientSecret: 'example_client_secret',
      icon: 'updated',
      name: 'Updated Example',
      scope: 'custom',
      tokenUrl: 'https://other.example/oauth/token',
      userInfoUrl: null,
    });
  });

  it('should handle if the app id is invalid', async () => {
    authorizeStudio();
    const response = await request.put('/api/apps/123/secrets/oauth2/1', {
      authorizationUrl: 'https://other.example/oauth/authorize',
      clientId: 'other_client_id',
      clientSecret: 'example_client_secret',
      icon: 'updated',
      name: 'Updated Example',
      scope: 'custom',
      tokenUrl: 'https://other.example/oauth/token',
      userInfoUrl: 'https://other.example/oauth/userinfo',
    });
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

  it('should handle if the secret id is invalid', async () => {
    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/secrets/oauth2/1`, {
      authorizationUrl: 'https://other.example/oauth/authorize',
      clientId: 'other_client_id',
      clientSecret: 'example_client_secret',
      icon: 'updated',
      name: 'Updated Example',
      scope: 'custom',
      tokenUrl: 'https://other.example/oauth/token',
      userInfoUrl: 'https://other.example/oauth/userinfo',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "OAuth2 secret not found",
        "statusCode": 404,
      }
    `);
  });

  it('should require the user to have correct permissions', async () => {
    const { AppOAuth2Secret } = await getAppDB(app.id);
    const secret = await AppOAuth2Secret.create({
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    await member.update({ role: 'Member' });
    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/secrets/oauth2/${secret.id}`, {
      authorizationUrl: 'https://other.example/oauth/authorize',
      clientId: 'other_client_id',
      clientSecret: 'example_client_secret',
      icon: 'updated',
      name: 'Updated Example',
      scope: 'custom',
      tokenUrl: 'https://other.example/oauth/token',
      userInfoUrl: 'https://other.example/oauth/userinfo',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient organization permissions.",
        "statusCode": 403,
      }
    `);
  });
});
