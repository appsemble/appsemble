import { ActionError } from '@appsemble/types';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { createTestAction } from '../makeActions.js';
import { apiUrl } from '../settings.js';

describe('group.join', () => {
  let mock: MockAdapter;
  let updateGroup: Mock;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    updateGroup = vi.fn();
  });

  it('should join a group and update the state', async () => {
    mock
      .onPost(`${apiUrl}/api/apps/42/groups/1337/members`)
      .reply(() => [201, { id: 1337, role: 'member', annotations: {} }]);
    const action = createTestAction({
      definition: { type: 'group.join' },
      getAppMemberInfo: () => ({
        sub: 'some-uuid',
        name: '',
        email: '',
        email_verified: false,
        demo: false,
        role: 'Member',
      }),
      updateGroup,
    });
    const result = await action(1337);
    expect(result).toStrictEqual({ id: 1337, role: 'member', annotations: {} });
    expect(updateGroup).toHaveBeenCalledWith({ id: 1337, role: 'member', annotations: {} });
  });

  it('should throw if the user is not logged in', async () => {
    const userInfo: any = undefined;
    const action = createTestAction({
      definition: { type: 'group.join' },
      getAppMemberInfo: () => userInfo,
      updateGroup,
    });
    await expect(action(1337)).rejects.toThrow(
      new ActionError({
        cause: 'User is not logged in',
        data: null,
        definition: { type: 'group.join' },
      }),
    );
  });
});

describe('group.list', () => {
  it('should return the user’s groups', async () => {
    const action = createTestAction({
      definition: { type: 'group.list' },
      appMemberGroups: [
        {
          groupId: 1337,
          groupName: 'IT',
          appMemberGroupRole: 'member',
          groupAnnotations: { foo: 'bar' },
        },
      ],
    });
    const result = await action('Input data');
    expect(result).toStrictEqual([
      {
        groupId: 1337,
        groupName: 'IT',
        appMemberGroupRole: 'member',
        groupAnnotations: { foo: 'bar' },
      },
    ]);
  });
});

describe('group.members', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  it('should get the members of the specified group', async () => {
    mock
      .onGet(`${apiUrl}/api/apps/42/groups/1337/members/some-uuid`)
      .reply(() => [200, { id: 1337, role: 'member', annotations: {} }]);
    mock
      .onGet(`${apiUrl}/api/apps/42/groups/1337/members`)
      .reply(() => [200, [{ id: 1337, role: 'member', annotations: {} }]]);

    const action = createTestAction({
      definition: { type: 'group.members', id: 1337 },
      appMemberGroups: [
        {
          groupId: 1337,
          groupName: 'IT',
          appMemberGroupRole: 'member',
        },
      ],
      getAppMemberInfo: () => ({
        sub: 'some-uuid',
        name: '',
        email: '',
        email_verified: false,
        demo: false,
        role: 'Member',
      }),
    });

    const result = await action();

    expect(result).toStrictEqual([{ id: 1337, role: 'member', annotations: {} }]);
  });

  it('should throw an error if the user isn’t in the group', async () => {
    mock.onGet(`${apiUrl}/api/apps/42/groups/1337/members`).reply(() => [200, []]);
    const action = createTestAction({
      definition: { type: 'group.members', id: 1337 },
      appMemberGroups: [
        {
          groupId: 1337,
          groupName: 'IT',
          appMemberGroupRole: 'member',
        },
      ],
      getAppMemberInfo: () => ({
        sub: 'some-uuid',
        name: '',
        email: '',
        email_verified: false,
        demo: false,
        role: 'Member',
      }),
    });

    await expect(action()).rejects.toThrow(
      new ActionError({
        cause: 'User is not a member of the specified group',
        data: null,
        definition: { type: 'group.members', id: 1337 },
      }),
    );
  });

  it('should throw an error if the user is not logged in/valid', async () => {
    mock.onGet(`${apiUrl}/api/apps/42/groups/1337/members`).reply(() => [200, []]);
    const appMemberInfo: any = undefined;
    const action = createTestAction({
      definition: { type: 'group.members', id: 1337 },
      appMemberGroups: [
        {
          groupId: 1337,
          groupName: 'IT',
          appMemberGroupRole: 'member',
        },
      ],
      getAppMemberInfo: () => appMemberInfo,
    });

    await expect(action()).rejects.toThrow(
      new ActionError({
        cause: 'User is not logged in',
        data: null,
        definition: { type: 'group.members', id: 1337 },
      }),
    );
  });
});
