import { createFormData, getS3File, streamToBuffer } from '@appsemble/node-utils';
import { PredefinedOrganizationRole, type Resource as ResourceType } from '@appsemble/types';
import { uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import stripIndent from 'strip-indent';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import webpush from 'web-push';

import {
  type App,
  Asset,
  Organization,
  OrganizationMember,
  Resource,
  ResourceVersion,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';
import { exampleApp } from '../../../../utils/test/exampleApp.js';

let organization: Organization;
let user: User;
let app: App;
let originalSendNotification: typeof webpush.sendNotification;

describe('updateAppResources', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
    originalSendNotification = webpush.sendNotification;
  });

  beforeEach(async () => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(0);
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      UserId: user.id,
      OrganizationId: organization.id,
      role: PredefinedOrganizationRole.Maintainer,
    });
    app = await exampleApp(organization.id);
  });

  afterAll(() => {
    webpush.sendNotification = originalSendNotification;
    vi.useRealTimers();
  });

  it('should be able to update existing resources', async () => {
    authorizeStudio();
    const { data: resources } = await request.post<{ foo: string }[]>(
      `/api/apps/${app.id}/resources/testResource`,
      [{ foo: 'bar' }, { foo: 'baz' }],
    );
    const response = await request.put(`/api/apps/${app.id}/resources/testResource`, [
      { ...resources[0], foo: 'baa' },
      { ...resources[1], foo: 'zaa' },
    ]);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "baa",
          "id": 1,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "zaa",
          "id": 2,
        },
      ]
    `);
  });

  it('should accept text/csv', async () => {
    authorizeStudio();
    const { data: resources } = await request.post<{ id: string }[]>(
      `/api/apps/${app.id}/resources/testResource`,
      [
        { foo: 'bar', bar: '00' },
        { foo: 'baz', bar: '11' },
      ],
    );

    const response = await request.put(
      `/api/apps/${app.id}/resources/testResource`,
      stripIndent(`
        id,foo,integer,boolean,number,object,array\r
        ${resources[0].id},a,42,true,3.14,{},[]\r
        ${resources[1].id},A,1337,false,9.8,{},[]\r
      `)
        .replace(/^\s+/, '')
        .replaceAll(/ +$/g, ''),
      { headers: { 'content-type': 'text/csv' } },
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "array": [],
          "boolean": true,
          "foo": "a",
          "id": 1,
          "integer": 42,
          "number": 3.14,
          "object": {},
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "array": [],
          "boolean": false,
          "foo": "A",
          "id": 2,
          "integer": 1337,
          "number": 9.8,
          "object": {},
        },
      ]
    `);
  });

  it('should accept assets as form data with multiple resources', async () => {
    vi.useRealTimers();
    authorizeStudio();
    const resources = await request.post<ResourceType[]>(
      `/api/apps/${app.id}/resources/testAssets`,
      createFormData({
        resource: [{ string: 'A' }, { string: 'B', file: '0' }],
        assets: Buffer.from('Test resource B'),
      }),
    );

    const response = await request.put<ResourceType[]>(
      `/api/apps/${app.id}/resources/testAssets`,
      createFormData({
        resource: [
          { id: resources.data[0].id, string: 'A', file: '0' },
          { id: resources.data[1].id, string: 'B updated' },
        ],
        assets: [Buffer.from('Test Resource A')],
      }),
    );

    const assets = await Asset.findAll({ raw: true });
    expect(assets).toStrictEqual([
      expect.objectContaining({
        AppId: app.id,
        ResourceId: 1,
        GroupId: null,
        AppMemberId: null,
        clonable: false,
        deleted: null,
        ephemeral: false,
        filename: null,
        id: response.data[0].file,
        mime: 'application/octet-stream',
        name: null,
        seed: false,
      }),
    ]);
    const assetsData = await Promise.all(
      assets.map(async (asset) => streamToBuffer(await getS3File(`app-${app.id}`, asset.id))),
    );
    expect(Buffer.from('Test Resource A').equals(assetsData[0])).toBe(true);

    response.data = response.data.map(({ $created, $updated, ...rest }) => rest) as ResourceType[];

    expect(response).toMatchInlineSnapshot(
      {
        data: [{ file: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/) }, {}],
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "file": StringMatching /\\^\\[0-f\\]\\{8\\}\\(\\?:-\\[0-f\\]\\{4\\}\\)\\{3\\}-\\[0-f\\]\\{12\\}\\$/,
          "id": 1,
          "string": "A",
        },
        {
          "id": 2,
          "string": "B updated",
        },
      ]
    `,
    );
  });

  it('should not be able to update existing resources if one of them is missing an ID', async () => {
    authorizeStudio();
    const { data: resources } = await request.post<{ foo: string }[]>(
      `/api/apps/${app.id}/resources/testResource`,
      [{ foo: 'bar' }, { foo: 'baz' }],
    );
    const response = await request.put(`/api/apps/${app.id}/resources/testResource`, [
      { foo: 'baa' },
      { ...resources[1], foo: 'zaa' },
    ]);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": [
          {
            "foo": "baa",
          },
        ],
        "error": "Bad Request",
        "message": "There is a resource with a missing id.",
        "statusCode": 400,
      }
    `);
  });

  it('should not be able to update existing resources if one the resources don’t exist', async () => {
    authorizeStudio();
    const { data: resources } = await request.post<{ foo: string }[]>(
      `/api/apps/${app.id}/resources/testResource`,
      [{ foo: 'bar' }, { foo: 'baz' }],
    );
    const response = await request.put(`/api/apps/${app.id}/resources/testResource`, [
      { id: 1000, foo: 'baa' },
      { ...resources[1], foo: 'zaa' },
    ]);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": [
          {
            "foo": "baa",
            "id": 1000,
          },
        ],
        "error": "Bad Request",
        "message": "One or more resources could not be found.",
        "statusCode": 400,
      }
    `);
  });

  it('should keep an old resource version including data if history is true', async () => {
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testHistoryTrue',
      data: { string: 'rev1' },
    });
    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/resources/testHistoryTrue`, [
      { string: 'rev2', id: resource.id },
    ]);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "id": 1,
          "string": "rev2",
        },
      ]
    `);
    await resource.reload();
    expect(resource.data).toStrictEqual({
      string: 'rev2',
    });
    const [resourceVersion] = await ResourceVersion.findAll({ raw: true });
    expect(resourceVersion).toStrictEqual({
      ResourceId: resource.id,
      AppMemberId: null,
      created: new Date(),
      data: { string: 'rev1' },
      id: expect.stringMatching(uuid4Pattern),
    });
  });

  it('should keep an old resource version including data if history.data is true', async () => {
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testHistoryDataTrue',
      data: { string: 'rev1' },
    });
    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/resources/testHistoryDataTrue`, [
      { string: 'rev2', id: resource.id },
    ]);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "id": 1,
          "string": "rev2",
        },
      ]
    `);
    await resource.reload();
    expect(resource.data).toStrictEqual({
      string: 'rev2',
    });
    const [resourceVersion] = await ResourceVersion.findAll({ raw: true });
    expect(resourceVersion).toStrictEqual({
      ResourceId: resource.id,
      AppMemberId: null,
      created: new Date(),
      data: { string: 'rev1' },
      id: expect.stringMatching(uuid4Pattern),
    });
  });

  it('should keep an old resource version excluding data if history.data is false', async () => {
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testHistoryDataFalse',
      data: { string: 'rev1' },
    });
    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/resources/testHistoryDataFalse`, [
      { string: 'rev2', id: resource.id },
    ]);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "id": 1,
          "string": "rev2",
        },
      ]
    `);
    await resource.reload();
    expect(resource.data).toStrictEqual({
      string: 'rev2',
    });
    const [resourceVersion] = await ResourceVersion.findAll({ raw: true });
    expect(resourceVersion).toStrictEqual({
      ResourceId: resource.id,
      AppMemberId: null,
      created: new Date(),
      data: null,
      id: expect.stringMatching(uuid4Pattern),
    });
  });
});
