import { readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AppCollection,
  Organization,
  OrganizationMember,
  type User,
} from '../../../models/index.js';
import { type Argv, setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { createTestUser } from '../../../utils/test/authorization.js';

let organization: Organization;
let user: User;
const argv: Partial<Argv> = { host: 'http://localhost', secret: 'test', aesSecret: 'test' };

describe('getAppCollectionHeaderImage', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv(argv);
    const server = await createServer({});
    await setTestApp(server);
  });

  beforeEach(async () => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(0);
    user = await createTestUser();
    organization = await Organization.create({
      id: String(Math.floor(100_000 + Math.random() * 900_000)),
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  it('should return app collection header image', async () => {
    const collection = await AppCollection.create({
      name: 'Private Collection',
      expertName: 'Expert van den Expert',
      expertProfileImage: Buffer.from(''),
      headerImage: await readFixture('standing.png'),
      expertProfileImageMimeType: 'image/png',
      headerImageMimeType: 'image/png',
      expertDescription: 'I’m an expert, trust me.',
      OrganizationId: organization.id,
      visibility: 'public',
    });

    const response = await request.get(`/api/app-collections/${collection.id}/header-image`, {
      responseType: 'arraybuffer',
    });
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.data).toStrictEqual(await readFixture('standing.png'));
  });
});
