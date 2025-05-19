import { PredefinedAppRole } from '@appsemble/lang-sdk';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  AppMember,
  Group,
  GroupMember,
  Organization,
  OrganizationMember,
  type User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';

let organization: Organization;
let app: App;
let user: User;
let server: Koa;

describe('getGroupMember', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          groups: {
            join: 'anyone',
            invite: [],
          },
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
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
  });

  it('should return specified member', async () => {
    const group = await Group.create({ name: 'Test group', AppId: app.id });
    const member = await AppMember.create({
      UserId: user.id,
      name: user.name,
      email: user.primaryEmail,
      AppId: app.id,
      role: PredefinedAppRole.Member,
    });
    const groupMember = await GroupMember.create({
      GroupId: group.id,
      AppMemberId: member.id,
      role: PredefinedAppRole.Member,
    });

    authorizeStudio();
    const response = await request.get(`/api/group-members/${groupMember.id}`);

    expect(response.data).toStrictEqual({
      id: groupMember.id,
      name: member.name,
      primaryEmail: member.email,
    });
  });
});
