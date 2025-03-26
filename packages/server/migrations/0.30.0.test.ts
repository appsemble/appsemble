import { logger, readFixture } from '@appsemble/node-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appPatches } from './0.30.0.js';
import { migrateAppDefinition } from '../commands/migrateAppDefinitions.js';
import { getDB } from '../models/index.js';

describe('migration 0.30.0', () => {
  beforeEach(() => {
    vi.spyOn(logger, 'error');
  });

  it('should replace `remap` with `remapBefore`.', async () => {
    const definition = await readFixture(
      'definitions/replace-remap-with-remap-before.yaml',
      'utf8',
    );
    const patched = await migrateAppDefinition(definition, appPatches, getDB());

    expect(logger.error).not.toHaveBeenCalled();
    expect(patched?.trim()).toBe(
      `
# Replace remap with remapBefore
name: test
description: test
defaultPage: test

pages:
  - name: test
    blocks:
      - type: action-button
        version: 0.29.0
        parameters:
          icon: arrow-right
        actions:
          onClick:
            type: noop
            remapBefore: { object.from: { test: test } }
    `.trim(),
    );
  });

  it('should replace `hideFromMenu` with `hideNavTitle`.', async () => {
    const definition = await readFixture(
      'definitions/replace-hide-from-menu-with-hide-nav-title.yaml',
      'utf8',
    );
    const patched = await migrateAppDefinition(definition, appPatches, getDB());

    expect(logger.error).not.toHaveBeenCalled();
    expect(patched?.trim()).toBe(
      `
# Replace hideFromMenu with hideNavTitle
name: test
description: test
defaultPage: test

pages:
  - name: test
    blocks:
      - type: action-button
        version: 0.29.0
        parameters:
          icon: arrow-right
        actions:
          onClick:
            type: noop
    hideNavTitle: true
    `.trim(),
    );
  });

  it('should rename users property to members', async () => {
    const definition = await readFixture(
      'definitions/rename-users-property-to-members.yaml',
      'utf8',
    );
    const patched = await migrateAppDefinition(definition, appPatches, getDB());

    expect(logger.error).not.toHaveBeenCalled();
    expect(patched?.trim()).toBe(
      `
# Rename users property to members
name: test
description: test
defaultPage: test

pages:
  - name: test
    blocks:
      - type: action-button
        version: 0.29.0
        parameters:
          icon: arrow-right
        actions:
          onClick:
            type: noop
members:
  properties:
    dateOfBirth:
      schema:
        type: string
    job:
      schema:
        enum:
          - Chef
          - Barista
          - Bartender
        default: Chef
    lastCompletedTask:
      schema:
        type: integer
      reference:
        resource: tasks
    readUpdates:
      schema:
        type: array
        items:
          type: integer
      reference:
        resource: updates
    `.trim(),
    );
  });

  it('should rename user actions to app.member actions.', async () => {
    const definition = await readFixture(
      'definitions/rename-user-actions-to-app-member-actions.yaml',
      'utf8',
    );
    const patched = await migrateAppDefinition(definition, appPatches, getDB());

    expect(logger.error).not.toHaveBeenCalled();
    expect(patched?.trim()).toBe(
      `
# Rename user actions to app.member actions
name: test
description: test
defaultPage: test

pages:
  - name: test
    blocks:
      - type: action-button
        version: 0.29.0
        parameters:
          icon: arrow-right
        actions:
          onClick:
            type: app.member.register
            email: { prop: email }
            password: { prop: password }
            picture: { prop: profilePicture }
            name: { prop: username }
      - type: action-button
        version: 0.29.0
        parameters:
          icon: arrow-right
        actions:
          onClick:
            type: app.member.login
      - type: action-button
        version: 0.29.0
        parameters:
          icon: arrow-right
        actions:
          onClick:
            type: app.member.logout
      - type: action-button
        version: 0.29.0
        parameters:
          icon: arrow-right
        actions:
          onClick:
            type: app.member.query
      - type: action-button
        version: 0.29.0
        parameters:
          icon: arrow-right
        actions:
          onClick:
            type: app.member.delete
    `.trim(),
    );
  });

  it('should rename team actions to group.member actions.', async () => {
    const definition = await readFixture(
      'definitions/rename-team-actions-to-group-member-actions.yaml',
      'utf8',
    );
    const patched = await migrateAppDefinition(definition, appPatches, getDB());

    expect(logger.error).not.toHaveBeenCalled();
    expect(patched?.trim()).toBe(
      `
# Rename team actions to group.member actions
name: test
description: test
defaultPage: test

pages:
  - name: test
    blocks:
      - type: action-button
        version: 0.29.0
        parameters:
          icon: arrow-right
        actions:
          onClick:
            type: group.member.invite
      - type: action-button
        version: 0.29.0
        parameters:
          icon: arrow-right
        actions:
          onClick:
            type: group.query
      - type: action-button
        version: 0.29.0
        parameters:
          icon: arrow-right
        actions:
          onClick:
            type: group.member.query
      - type: action-button
        version: 0.29.0
        parameters:
          icon: arrow-right
        actions:
          onClick:
            type: team.join
    `.trim(),
    );
  });

  it('should delete roles property', async () => {
    const definition = await readFixture('definitions/delete-roles.yaml', 'utf8');
    const patched = await migrateAppDefinition(definition, appPatches, getDB());

    expect(logger.error).not.toHaveBeenCalled();
    expect(patched?.trim()).toBe(
      `
# Delete roles property
name: test
description: test
defaultPage: test

security:
  default:
    role: test
    policy: everyone
  roles:
    test:
      description: test
      permissions: []

pages:
  - name: test
    blocks:
      - type: action-button
        version: 0.29.0
        parameters:
          icon: arrow-right
        actions:
          onClick:
            type: noop
    `.trim(),
    );
  });

  it('should delete resource.method', async () => {
    const definition = await readFixture('definitions/delete-resource-method.yaml', 'utf8');
    const patched = await migrateAppDefinition(definition, appPatches, getDB());

    expect(logger.error).not.toHaveBeenCalled();
    expect(patched?.trim()).toBe(
      `
# Delete resource.method property
name: test
description: test
defaultPage: test

pages:
  - name: test
    blocks:
      - type: action-button
        version: 0.29.0
        parameters:
          icon: arrow-right
        actions:
          onClick:
            type: resource.create
            resource: test
    `.trim(),
    );
  });

  it('should replace `$none` with `$guest` and add guest to security.', async () => {
    const definition = await readFixture('definitions/replace-none-with-guest.yaml', 'utf8');
    const patched = await migrateAppDefinition(definition, appPatches, getDB());

    expect(logger.error).not.toHaveBeenCalled();
    expect(patched?.trim()).toBe(
      `
# Replace $none with $guest
name: test
description: test
defaultPage: test

pages:
  - name: test
    roles: [ $guest ]
    blocks:
      - type: action-button
        version: 0.29.0
        parameters:
          icon: arrow-right
        actions:
          onClick:
            type: noop
security:
  guest:
    permissions: []
    `.trim(),
    );
  });

  it('should add guest to security if missing when $public is used in resources.', async () => {
    const definition1 = await readFixture(
      'definitions/add-guest-to-security-for-public.yaml',
      'utf8',
    );
    const patched1 = await migrateAppDefinition(definition1, appPatches, getDB());

    expect(logger.error).not.toHaveBeenCalled();
    expect(patched1?.trim()).toBe(
      `
# Add guest to security
name: test
description: test
defaultPage: test

security:
  default:
    role: roleA
    policy: everyone
  roles:
    roleA:
      description: test
      permissions:
        - $resource:test:create
        - $resource:test:update
        - $resource:test:patch
        - $resource:test:query
        - $resource:test:get
        - $resource:test:delete
    roleB:
      description: test
      permissions:
        - $resource:test:create
        - $resource:test:update
        - $resource:test:patch
        - $resource:test:query
        - $resource:test:get
        - $resource:test:delete
  guest:
    permissions:
      - $resource:test:create
      - $resource:test:update
      - $resource:test:patch
      - $resource:test:query
      - $resource:test:get
      - $resource:test:delete

resources:
  test:
    schema:
      additionalProperties: false
      type: object
      properties:
        test:
          type: string

pages:
  - name: test
    blocks:
      - type: action-button
        version: 0.29.0
        parameters:
          icon: arrow-right
        actions:
          onClick:
            type: noop
    `.trim(),
    );

    const definition2 = await readFixture(
      'definitions/add-guest-to-security-for-action-public.yaml',
      'utf8',
    );
    const patched2 = await migrateAppDefinition(definition2, appPatches, getDB());

    expect(logger.error).not.toHaveBeenCalled();
    expect(patched2?.trim()).toBe(
      `
# Add guest to security
name: test
description: test
defaultPage: test

security:
  default:
    role: roleA
    policy: everyone
  roles:
    roleA:
      description: test
      permissions:
        - $resource:test:create
    roleB:
      description: test
      permissions:
        - $resource:test:create
  guest:
    permissions:
      - $resource:test:create

resources:
  test:
    schema:
      additionalProperties: false
      type: object
      properties:
        test:
          type: string

pages:
  - name: test
    blocks:
      - type: action-button
        version: 0.29.0
        parameters:
          icon: arrow-right
        actions:
          onClick:
            type: noop
    `.trim(),
    );

    const definition3 = await readFixture(
      'definitions/add-guest-to-security-for-view-public.yaml',
      'utf8',
    );
    const patched3 = await migrateAppDefinition(definition3, appPatches, getDB());

    expect(logger.error).not.toHaveBeenCalled();
    expect(patched3?.trim()).toBe(
      `
# Add guest to security
name: test
description: test
defaultPage: test

security:
  default:
    role: roleA
    policy: everyone
  roles:
    roleA:
      description: test
      permissions:
        - $resource:test:query:test
        - $resource:test:get:test
    roleB:
      description: test
      permissions:
        - $resource:test:query:test
        - $resource:test:get:test
  guest:
    permissions:
      - $resource:test:query:test
      - $resource:test:get:test

resources:
  test:
    views:
      test: {}
    schema:
      additionalProperties: false
      type: object
      properties:
        test:
          type: string

pages:
  - name: test
    blocks:
      - type: action-button
        version: 0.29.0
        parameters:
          icon: arrow-right
        actions:
          onClick:
            type: noop
    `.trim(),
    );
  });

  it('should add roles `Member` and `GroupsManager` to security.roles if used.', async () => {
    const definition = await readFixture('definitions/add-group-roles.yaml', 'utf8');
    const patched = await migrateAppDefinition(definition, appPatches, getDB());

    expect(logger.error).not.toHaveBeenCalled();
    expect(patched?.trim()).toBe(
      `
# Add group roles
name: test
description: test
defaultPage: test

security:
  default:
    role: roleA
    policy: everyone
  roles:
    roleA:
      description: test
      permissions:
        - $group:create
    roleB:
      description: test
      permissions:
        - $group:member:invite
    GroupManager:
      permissions:
        - $group:create
        - $resource:test:create
        - $resource:test:update
        - $resource:test:patch
        - $resource:test:query
        - $resource:test:get
        - $resource:test:delete
    GroupMember:
      permissions:
        - $group:member:invite
        - $resource:test:create
        - $resource:test:update
        - $resource:test:patch
        - $resource:test:query
        - $resource:test:get
        - $resource:test:delete
    GroupManagerroleA:
      permissions: []
      inherits:
        - GroupManager
        - roleA
    GroupManagerroleB:
      permissions: []
      inherits:
        - GroupManager
        - roleB
    GroupMemberroleA:
      permissions: []
      inherits:
        - GroupMember
        - roleA
    GroupMemberroleB:
      permissions: []
      inherits:
        - GroupMember
        - roleB

resources:
  test:
    schema:
      additionalProperties: false
      type: object
      properties:
        test:
          type: string

pages:
  - name: test
    blocks:
      - type: action-button
        version: 0.29.0
        parameters:
          icon: arrow-right
        actions:
          onClick:
            type: noop
    `.trim(),
    );
  });

  it('should move resource roles to role permissions', async () => {
    const definition = await readFixture(
      'definitions/move-resource-roles-to-role-permissions.yaml',
      'utf8',
    );
    const patched = await migrateAppDefinition(definition, appPatches, getDB());

    expect(logger.error).not.toHaveBeenCalled();
    expect(patched?.trim()).toBe(
      `
# Move resource roles to role permissions:
name: test
description: test
defaultPage: test

security:
  default:
    role: roleA
    policy: everyone
  roles:
    roleA:
      description: test
      permissions:
        - $resource:resourceA:update
        - $resource:resourceA:patch
        - $resource:resourceA:query
        - $resource:resourceA:get
        - $resource:resourceA:delete
        - $resource:resourceB:update
        - $resource:resourceB:patch
        - $resource:resourceB:query
        - $resource:resourceB:get
        - $resource:resourceB:delete
        - $resource:resourceD:own:update
        - $resource:resourceD:own:patch
        - $resource:resourceD:own:query
        - $resource:resourceD:own:get
        - $resource:resourceD:own:delete
        - $resource:resourceC:update
        - $resource:resourceC:patch
        - $resource:resourceC:query:public
        - $resource:resourceC:get:public
        - $resource:all:create
    roleB:
      description: test
      permissions:
        - $resource:resourceA:create
        - $resource:resourceA:update
        - $resource:resourceA:patch
        - $resource:resourceA:query
        - $resource:resourceA:get
        - $resource:resourceA:delete
        - $resource:resourceB:create
        - $resource:resourceB:update
        - $resource:resourceB:patch
        - $resource:resourceB:query
        - $resource:resourceB:get
        - $resource:resourceB:delete
        - $resource:resourceD:own:update
        - $resource:resourceD:own:patch
        - $resource:resourceD:own:query
        - $resource:resourceD:own:get
        - $resource:resourceD:own:delete
        - $resource:resourceC:get
        - $resource:resourceC:query
        - $resource:resourceC:delete
        - $resource:resourceD:create
    GroupManager:
      permissions:
        - $resource:resourceB:create
        - $resource:resourceB:update
        - $resource:resourceB:patch
        - $resource:resourceB:query
        - $resource:resourceB:get
        - $resource:resourceB:delete
        - $resource:resourceD:own:update
        - $resource:resourceD:own:patch
        - $resource:resourceD:own:query
        - $resource:resourceD:own:get
        - $resource:resourceD:own:delete
        - $resource:resourceC:create
        - $resource:resourceC:update
        - $resource:resourceC:patch
        - $resource:resourceC:get
        - $resource:resourceC:query
        - $resource:resourceC:delete
        - $resource:resourceD:create
    GroupMember:
      permissions:
        - $resource:resourceB:create
        - $resource:resourceB:update
        - $resource:resourceB:patch
        - $resource:resourceB:query
        - $resource:resourceB:get
        - $resource:resourceB:delete
        - $resource:resourceD:own:update
        - $resource:resourceD:own:patch
        - $resource:resourceD:own:query
        - $resource:resourceD:own:get
        - $resource:resourceD:own:delete
        - $resource:resourceC:get
        - $resource:resourceC:query
        - $resource:resourceD:create
    GroupManagerroleA:
      permissions: []
      inherits:
        - GroupManager
        - roleA
    GroupManagerroleB:
      permissions: []
      inherits:
        - GroupManager
        - roleB
    GroupMemberroleA:
      permissions: []
      inherits:
        - GroupMember
        - roleA
    GroupMemberroleB:
      permissions: []
      inherits:
        - GroupMember
        - roleB
  guest:
    permissions:
      - $resource:resourceB:create
      - $resource:resourceB:update
      - $resource:resourceB:patch
      - $resource:resourceB:query
      - $resource:resourceB:get
      - $resource:resourceB:delete
      - $resource:resourceD:create
      - $resource:resourceC:query:public
      - $resource:resourceC:get:public

resources:
  resourceA:
    schema:
      additionalProperties: false
      type: object
      properties:
        test:
          type: string
  resourceB:
    schema:
      additionalProperties: false
      type: object
      properties:
        test:
          type: string
  resourceC:
    # ignore this, only if the action done doesn't define roles
    schema:
      additionalProperties: false
      type: object
      properties:
        test:
          type: string
    create:
      hooks:
        notification:
          to:
            - roleA # Notify users with the Admin role when a \`person\` resource is created.
          subscribe: both # Users are able to both subscribe.
    views:
      public:
        remap:
          object.from:
            id:
              prop: id
            test:
              prop: test
            $created:
              prop: $created
  resourceD:
    schema:
      additionalProperties: false
      type: object
      properties:
        test:
          type: string

pages:
  - name: test
    blocks:
      - type: action-button
        version: 0.29.0
        parameters:
          icon: arrow-right
        actions:
          onClick:
            type: noop
    `.trim(),
    );
  });

  it('should remove `$public`.', async () => {
    const definition = await readFixture('definitions/delete-special-public-role.yaml', 'utf8');
    const patched = await migrateAppDefinition(definition, appPatches, getDB());

    expect(logger.error).not.toHaveBeenCalled();
    expect(patched?.trim()).toBe(
      `
# Delete $public
name: test
description: test
defaultPage: test

pages:
  - name: test
    blocks:
      - type: action-button
        version: 0.29.0
        parameters:
          icon: arrow-right
        actions:
          onClick:
            remapBefore:
              roles: []
            type: resource.create
            resource: test
  - name: tabs
    type: tabs
    tabs:
      - name: subpage
        blocks:
          - type: action-button
            version: 0.29.0
            parameters:
              icon: arrow-right
            actions:
              onClick:
                remapBefore:
                  roles: []
                type: resource.create
                resource: test
  - name: tabs
    type: tabs
    definition:
      events: {}
      foreach:
        - name: dynamic tab
          blocks:
            - type: action-button
              version: 0.29.0
              parameters:
                icon: arrow-right
              actions:
                onClick:
                  remapBefore:
                    roles: []
                  type: resource.create
                  resource: test
  - name: flow
    type: flow
    steps:
      - name: subpage
        blocks:
          - type: action-button
            version: 0.29.0
            parameters:
              icon: arrow-right
            actions:
              onClick:
                remapBefore:
                  roles: []
                type: resource.create
                resource: test
  - name: loop
    type: loop
    foreach:
      - name: subpage
        blocks:
          - type: action-button
            version: 0.29.0
            parameters:
              icon: arrow-right
            actions:
              onClick:
                remapBefore:
                  roles: []
                type: resource.create
                resource: test
    `.trim(),
    );
  });
});
