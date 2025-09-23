import { randomBytes } from 'node:crypto';

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
import { createTestUser } from '../../../../utils/test/authorization.js';

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

  it('should reject unauthorized', async () => {
    const res = await request.post(`/api/apps/${app.id}/webhooks/createRecord`, {});

    expect(res).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: text/plain; charset=utf-8

      Unauthorized
    `);
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
    expect(res).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "foo": "bar",
      }
    `);
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
    expect(res).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: text/plain; charset=utf-8

      OK
    `);
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
    expect(res2).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: text/plain; charset=utf-8

      OK
    `);

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
    expect(res3).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: text/plain; charset=utf-8

      OK
    `);

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
