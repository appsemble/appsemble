import { beforeEach, describe } from 'vitest';

import { useTestDatabase } from './test/testSchema.js';
import { App, AppMember, Organization } from "../models/index.js";

useTestDatabase(import.meta);

beforeEach(async () => {
  await Organization.create({
    id: 'test-organization',
    name: 'Test Organization',
  });
});

describe('getAppMemberScopedRole', () => {
  let app: App;

  beforeEach(async () => {
    app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'test-organization',
    });
  });

  it('should resolve to a group role if a group is selected and the app member is a member of the group', async () => {
    const appMember = await AppMember.create({
      AppId: app.id,
    });

    const role = getAppMemberScopedRole()
  });

  it.todo(
    'should resolve to null if a group is selected but the app member is not a member of the group',
  );

  it.todo('should resolve to an app role if no group is selected');

  it.todo('should resolve to null if the app member does not exist');
});
