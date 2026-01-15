import { randomBytes } from 'node:crypto';

import { PredefinedAppRole } from '@appsemble/lang-sdk';
import { createFixtureStream, createFormData } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  type AppWebhookSecret,
  getAppDB,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { encrypt } from '../../../../utils/crypto.js';
import {
  authorizeAppMember,
  createTestAppMember,
  createTestUser,
  unauthorize,
} from '../../../../utils/test/authorization.js';

let organization: Organization;
let user: User;
let app: App;
let createSecret: AppWebhookSecret;
let patchSecret: AppWebhookSecret;
let updateSecret: AppWebhookSecret;

const aesSecret = 'testSecret';
const argv = { host: 'http://localhost', secret: 'test', aesSecret };

describe('callAppWebhook', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv(argv);
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
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
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        resources: {
          record: {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                foo: { type: 'string' },
                pdf: { type: 'string', format: 'binary' },
                xml: { type: 'string', format: 'binary' },
              },
            },
          },
        },
        webhooks: {
          createRecord: {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['foo'],
              properties: {
                foo: { type: 'string' },
                pdf: { type: 'string', format: 'binary' },
                xml: { type: 'string', format: 'binary' },
              },
            },
            action: {
              type: 'resource.create',
              resource: 'record',
            },
          },
          updateFirstRecord: {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['foo'],
              properties: {
                foo: { type: 'string' },
                pdf: { type: 'string', format: 'binary' },
                xml: { type: 'string', format: 'binary' },
              },
            },
            action: {
              type: 'resource.query',
              resource: 'record',
              onSuccess: {
                remapBefore: [
                  {
                    'object.from': {
                      id: [{ prop: 0 }, { prop: 'id' }],
                      foo: [{ history: 0 }, { prop: 'foo' }],
                      pdf: [{ history: 0 }, { prop: 'pdf' }],
                      xml: [{ history: 0 }, { prop: 'xml' }],
                    },
                  },
                ],
                type: 'resource.update',
                resource: 'record',
              },
            },
          },
          patchFirstRecord: {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['foo'],
              properties: {
                foo: { type: 'string' },
                pdf: { type: 'string', format: 'binary' },
                xml: { type: 'string', format: 'binary' },
              },
            },
            action: {
              type: 'resource.query',
              resource: 'record',
              onSuccess: {
                remapBefore: [
                  {
                    'object.from': {
                      id: [{ prop: 0 }, { prop: 'id' }],
                      foo: [{ history: 0 }, { prop: 'foo' }],
                      pdf: [{ history: 0 }, { prop: 'pdf' }],
                      xml: [{ history: 0 }, { prop: 'xml' }],
                    },
                  },
                ],
                type: 'resource.patch',
                resource: 'record',
              },
            },
          },
        },
      },
    });

    const { AppWebhookSecret } = await getAppDB(app.id);
    createSecret = await AppWebhookSecret.create({
      webhookName: 'createRecord',
      secret: encrypt(randomBytes(40).toString('hex'), aesSecret),
    });

    patchSecret = await AppWebhookSecret.create({
      webhookName: 'patchFirstRecord',
      secret: encrypt(randomBytes(40).toString('hex'), aesSecret),
    });

    updateSecret = await AppWebhookSecret.create({
      webhookName: 'updateFirstRecord',
      secret: encrypt(randomBytes(40).toString('hex'), aesSecret),
    });
  });

  it('should not handle requests other than post', async () => {
    const endpoint = `/api/apps/${app.id}/webhooks/createRecord`;
    const get = await request.get(endpoint);
    const put = await request.put(endpoint);
    const patch = await request.patch(endpoint);
    const del = await request.delete(endpoint);

    expect(get).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "URL not found",
        "statusCode": 404,
      }
    `);
    expect(put).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "URL not found",
        "statusCode": 404,
      }
    `);
    expect(patch).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "URL not found",
        "statusCode": 404,
      }
    `);
    expect(del).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "URL not found",
        "statusCode": 404,
      }
    `);
  });

  it('should allow guests when app has no security definition', async () => {
    // Apps without security definition allow guest access to webhooks
    // But schema validation still applies
    const res = await request.post(`/api/apps/${app.id}/webhooks/createRecord`, { foo: 'bar' });

    expect(res.status).toBe(200);
    expect(res.data).toStrictEqual(
      expect.objectContaining({
        id: 1,
        foo: 'bar',
      }),
    );
  });

  it('should handle webhook schema validation', async () => {
    const res = await request.post(
      `/api/apps/${app.id}/webhooks/createRecord`,
      {},
      { headers: { Authorization: `Bearer ${createSecret.secret.toString('hex')}` } },
    );
    expect(res).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "errors": [
            {
              "argument": "foo",
              "instance": {},
              "message": "requires property "foo"",
              "name": "required",
              "path": [],
              "property": "instance",
              "schema": {
                "additionalProperties": false,
                "properties": {
                  "foo": {
                    "type": "string",
                  },
                  "pdf": {
                    "properties": {
                      "filename": {
                        "type": "string",
                      },
                      "mime": {
                        "type": "string",
                      },
                      "path": {
                        "type": "string",
                      },
                    },
                    "type": "object",
                  },
                  "xml": {
                    "properties": {
                      "filename": {
                        "type": "string",
                      },
                      "mime": {
                        "type": "string",
                      },
                      "path": {
                        "type": "string",
                      },
                    },
                    "type": "object",
                  },
                },
                "required": [
                  "foo",
                ],
                "type": "object",
              },
              "stack": "instance requires property "foo"",
            },
          ],
        },
        "error": "Bad Request",
        "message": "Webhook body validation failed",
        "statusCode": 400,
      }
    `);
  });

  it('should handle webhook schema validation with files', async () => {
    const res = await request.post(
      `/api/apps/${app.id}/webhooks/createRecord`,
      createFormData({
        foo: 'bar',
        pdf: 'sample.pdf',
        xml: createFixtureStream('note.xml'),
      }),
      { headers: { Authorization: `Bearer ${createSecret.secret.toString('hex')}` } },
    );
    expect(res).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "errors": [
            {
              "argument": [
                "object",
              ],
              "instance": "sample.pdf",
              "message": "is not of a type(s) object",
              "name": "type",
              "path": [
                "pdf",
              ],
              "property": "instance.pdf",
              "schema": {
                "properties": {
                  "filename": {
                    "type": "string",
                  },
                  "mime": {
                    "type": "string",
                  },
                  "path": {
                    "type": "string",
                  },
                },
                "type": "object",
              },
              "stack": "instance.pdf is not of a type(s) object",
            },
          ],
        },
        "error": "Bad Request",
        "message": "Webhook body validation failed",
        "statusCode": 400,
      }
    `);
  });

  it('should handle webhook calls', async () => {
    const res = await request.post(
      `/api/apps/${app.id}/webhooks/createRecord`,
      { foo: 'bar' },
      { headers: { Authorization: `Bearer ${createSecret.secret.toString('hex')}` } },
    );
    expect(res.status).toBe(200);
    expect(res.data).toStrictEqual(
      expect.objectContaining({
        id: 1,
        foo: 'bar',
      }),
    );
    const { Resource } = await getAppDB(app.id);
    const resource = (await Resource.findOne())!;
    expect(resource.toJSON()).toStrictEqual(
      expect.objectContaining({
        id: 1,
        foo: 'bar',
      }),
    );
  });

  it('should handle webhook calls with files', async () => {
    const res = await request.post(
      `/api/apps/${app.id}/webhooks/createRecord`,
      createFormData({
        foo: 'bar',
        pdf: createFixtureStream('sample.pdf'),
        xml: createFixtureStream('note.xml'),
      }),
      { headers: { Authorization: `Bearer ${createSecret.secret.toString('hex')}` } },
    );
    expect(res.status).toBe(200);
    expect(res.data).toStrictEqual(
      expect.objectContaining({
        id: 1,
        foo: 'bar',
        pdf: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
        xml: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
      }),
    );
    const { Resource } = await getAppDB(app.id);
    const resource = (await Resource.findOne())!;
    expect(resource.toJSON()).toStrictEqual(
      expect.objectContaining({
        id: 1,
        foo: 'bar',
        pdf: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
        xml: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
      }),
    );

    const res2 = await request.post(
      `/api/apps/${app.id}/webhooks/patchFirstRecord`,
      createFormData({
        foo: 'baz',
        pdf: createFixtureStream('note.xml'),
      }),
      { headers: { Authorization: `Bearer ${patchSecret.secret.toString('hex')}` } },
    );
    expect(res2.status).toBe(200);
    expect(res2.data).toStrictEqual(
      expect.objectContaining({
        id: 1,
        foo: 'baz',
        pdf: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
      }),
    );

    await resource.reload();
    expect(resource.toJSON()).toStrictEqual(
      expect.objectContaining({
        foo: 'baz',
        pdf: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
      }),
    );
    expect(resource.data.xml).toBeUndefined();

    const res3 = await request.post(
      `/api/apps/${app.id}/webhooks/updateFirstRecord`,
      createFormData({
        foo: 'bam',
        pdf: createFixtureStream('note.xml'),
        xml: createFixtureStream('note.xml'),
      }),
      { headers: { Authorization: `Bearer ${updateSecret.secret.toString('hex')}` } },
    );
    expect(res3.status).toBe(200);
    expect(res3.data).toStrictEqual(
      expect.objectContaining({
        id: 1,
        foo: 'bam',
        pdf: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
        xml: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
      }),
    );

    await resource.reload();
    expect(resource.toJSON()).toStrictEqual(
      expect.objectContaining({
        foo: 'bam',
        pdf: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
        xml: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
      }),
    );
  });
});

describe('callAppWebhook permissions', () => {
  let appWithSecurity: App;
  let appWithGuestWebhookPermission: App;
  let createSecretForSecurityApp: AppWebhookSecret;

  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv(argv);
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
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

    // App with security but NO guest webhook permission
    appWithSecurity = await App.create({
      path: 'app-with-security',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      definition: {
        name: 'App With Security',
        defaultPage: 'Test Page',
        security: {
          default: { role: 'User' },
          roles: {
            User: {
              permissions: ['$webhook:createRecord:invoke'],
            },
          },
          // Guest has NO webhook permissions
        },
        resources: {
          record: {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                foo: { type: 'string' },
              },
            },
          },
        },
        webhooks: {
          createRecord: {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['foo'],
              properties: {
                foo: { type: 'string' },
              },
            },
            action: {
              type: 'resource.create',
              resource: 'record',
            },
          },
        },
      },
    });

    // App with guest webhook permission
    appWithGuestWebhookPermission = await App.create({
      path: 'app-with-guest-permission',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      definition: {
        name: 'App With Guest Permission',
        defaultPage: 'Test Page',
        security: {
          default: { role: 'User' },
          guest: {
            permissions: ['$webhook:createRecord:invoke'],
          },
          roles: {
            User: {
              permissions: [],
            },
          },
        },
        resources: {
          record: {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                foo: { type: 'string' },
              },
            },
          },
        },
        webhooks: {
          createRecord: {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['foo'],
              properties: {
                foo: { type: 'string' },
              },
            },
            action: {
              type: 'resource.create',
              resource: 'record',
            },
          },
        },
      },
    });

    const { AppWebhookSecret } = await getAppDB(appWithSecurity.id);
    createSecretForSecurityApp = await AppWebhookSecret.create({
      webhookName: 'createRecord',
      secret: encrypt(randomBytes(40).toString('hex'), aesSecret),
    });
  });

  it('should reject unauthenticated requests when guest has no webhook permission', async () => {
    unauthorize();
    const res = await request.post(`/api/apps/${appWithSecurity.id}/webhooks/createRecord`, {
      foo: 'bar',
    });

    expect(res).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "Guest does not have sufficient app permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should allow unauthenticated requests when guest has webhook permission', async () => {
    unauthorize();
    const res = await request.post(
      `/api/apps/${appWithGuestWebhookPermission.id}/webhooks/createRecord`,
      { foo: 'bar' },
    );

    expect(res.status).toBe(200);
    expect(res.data).toStrictEqual(
      expect.objectContaining({
        foo: 'bar',
        id: 1,
      }),
    );

    const { Resource } = await getAppDB(appWithGuestWebhookPermission.id);
    const resource = (await Resource.findOne())!;
    expect(resource.toJSON()).toStrictEqual(
      expect.objectContaining({
        id: 1,
        foo: 'bar',
      }),
    );
  });

  it('should reject app member requests when member role has no webhook permission', async () => {
    // Create app member with 'User' role that has no webhook permissions
    const appMember = await createTestAppMember(
      appWithGuestWebhookPermission.id,
      'member@example.com',
      PredefinedAppRole.Member,
    );
    authorizeAppMember(appWithGuestWebhookPermission, appMember);

    const res = await request.post(
      `/api/apps/${appWithGuestWebhookPermission.id}/webhooks/createRecord`,
      { foo: 'bar' },
    );

    expect(res).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "App member does not have sufficient app permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should allow app member requests when member role has webhook permission', async () => {
    // Create app member with 'User' role that HAS webhook permissions
    const appMember = await createTestAppMember(
      appWithSecurity.id,
      'member@example.com',
      'User' as PredefinedAppRole,
    );
    authorizeAppMember(appWithSecurity, appMember);

    const res = await request.post(`/api/apps/${appWithSecurity.id}/webhooks/createRecord`, {
      foo: 'bar',
    });

    expect(res.status).toBe(200);
    expect(res.data).toStrictEqual(
      expect.objectContaining({
        foo: 'bar',
        id: 1,
      }),
    );

    const { Resource } = await getAppDB(appWithSecurity.id);
    const resource = (await Resource.findOne())!;
    expect(resource.toJSON()).toStrictEqual(
      expect.objectContaining({
        id: 1,
        foo: 'bar',
      }),
    );
  });

  it('should always allow webhook secret authentication regardless of permissions', async () => {
    // Even though guest has no permission, webhook secret should bypass all checks
    const res = await request.post(
      `/api/apps/${appWithSecurity.id}/webhooks/createRecord`,
      { foo: 'bar' },
      { headers: { Authorization: `Bearer ${createSecretForSecurityApp.secret.toString('hex')}` } },
    );

    expect(res.status).toBe(200);
    expect(res.data).toStrictEqual(
      expect.objectContaining({
        foo: 'bar',
        id: 1,
      }),
    );
  });

  it('should return the action result in the response body', async () => {
    const res = await request.post(
      `/api/apps/${appWithSecurity.id}/webhooks/createRecord`,
      { foo: 'test-result' },
      { headers: { Authorization: `Bearer ${createSecretForSecurityApp.secret.toString('hex')}` } },
    );

    expect(res.status).toBe(200);
    // Resource.create returns the full resource with metadata
    expect(res.data).toStrictEqual(
      expect.objectContaining({
        foo: 'test-result',
        id: expect.any(Number),
      }),
    );
  });
});
