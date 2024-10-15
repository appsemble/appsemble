import { createFixtureStream } from '@appsemble/node-utils';
import { type BlockManifest, PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import FormData from 'form-data';
import { omit } from 'lodash-es';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  BlockVersion,
  Organization,
  OrganizationMember,
  type User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeClientCredentials, createTestUser } from '../../../utils/test/authorization.js';

let user: User;

describe('queryBlocks', () => {
  beforeEach(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    user = await createTestUser();
    const organization = await Organization.create({
      id: 'xkcd',
      name: 'xkcd',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Maintainer,
    });
    await setTestApp(server);
  });

  it('should be possible to query block definitions', async () => {
    const formDataA = new FormData();
    formDataA.append('name', '@xkcd/apple');
    formDataA.append('version', '0.0.0');
    formDataA.append('description', 'I’ve got an apple.');
    formDataA.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });

    await authorizeClientCredentials('blocks:write');
    const { data: apple } = await request.post<BlockManifest>('/api/blocks', formDataA);

    const formDataB = new FormData();
    formDataB.append('name', '@xkcd/pen');
    formDataB.append('version', '0.0.0');
    formDataB.append('description', 'I’ve got a pen.');
    formDataB.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });

    await authorizeClientCredentials('blocks:write');
    const { data: pen } = await request.post<BlockManifest>('/api/blocks', formDataB);

    const { data: bam } = await request.get<BlockManifest[]>('/api/blocks');
    expect(bam).toStrictEqual(
      expect.arrayContaining([
        omit(apple, ['files', 'languages']),
        omit(pen, ['files', 'languages']),
      ]),
    );
  });

  it('should not include unlisted blocks', async () => {
    await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test-2',
      version: '1.2.3',
      visibility: 'unlisted',
    });

    const { data: response } = await request.get<BlockManifest[]>('/api/blocks');
    expect(response).toHaveLength(1);
    expect(response).toMatchInlineSnapshot(`
      [
        {
          "actions": null,
          "description": null,
          "events": null,
          "examples": [],
          "iconUrl": null,
          "layout": null,
          "longDescription": null,
          "name": "@xkcd/test",
          "parameters": null,
          "version": "1.2.3",
          "wildcardActions": false,
        },
      ]
    `);
  });

  it('should include unlisted blocks for the organizations the user is a part of', async () => {
    await Organization.create({
      id: 'not-xkcd',
      name: 'not-xkcd',
    });
    await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test-2',
      version: '1.2.3',
      visibility: 'unlisted',
    });
    await BlockVersion.create({
      OrganizationId: 'not-xkcd',
      name: 'not-test',
      version: '1.2.3',
    });
    await BlockVersion.create({
      OrganizationId: 'not-xkcd',
      name: 'test-2',
      version: '1.2.3',
      visibility: 'unlisted',
    });

    const { data: response } = await request.get<BlockManifest[]>('/api/blocks');
    expect(response).toHaveLength(2);
    expect(response).toMatchInlineSnapshot(`
      [
        {
          "actions": null,
          "description": null,
          "events": null,
          "examples": [],
          "iconUrl": null,
          "layout": null,
          "longDescription": null,
          "name": "@xkcd/test",
          "parameters": null,
          "version": "1.2.3",
          "wildcardActions": false,
        },
        {
          "actions": null,
          "description": null,
          "events": null,
          "examples": [],
          "iconUrl": null,
          "layout": null,
          "longDescription": null,
          "name": "@not-xkcd/not-test",
          "parameters": null,
          "version": "1.2.3",
          "wildcardActions": false,
        },
      ]
    `);
  });
});
