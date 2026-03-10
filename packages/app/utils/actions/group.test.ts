import { ActionError } from '@appsemble/lang-sdk';
import { describe, expect, it, vi } from 'vitest';

import { createTestAction } from '../makeActions.js';

describe('group.query', () => {
  it('should make a get request to fetch user groups', async () => {
    const action = createTestAction({
      definition: { type: 'group.query' },
      appMemberGroups: [{ id: 2, name: 'Test Group', role: 'Member' }],
    });
    const result = await action('Test');
    expect(result).toStrictEqual([{ id: 2, name: 'Test Group', role: 'Member' }]);
  });
});

describe('group.selected.update', () => {
  it('should update the selected group', async () => {
    const setAppMemberSelectedGroup = vi.fn();
    const action = createTestAction({
      definition: { type: 'group.selected.update', groupId: { prop: 'groupId' } },
      appMemberGroups: [{ id: 15, name: 'Test Group', role: 'Member' }],
      setAppMemberSelectedGroup,
    });

    await action({ groupId: 15 });

    expect(setAppMemberSelectedGroup).toHaveBeenCalledWith(15);
  });

  it('should clear the selected group if groupId is null', async () => {
    const setAppMemberSelectedGroup = vi.fn();
    const action = createTestAction({
      definition: { type: 'group.selected.update', groupId: null },
      setAppMemberSelectedGroup,
    });

    await action({});

    expect(setAppMemberSelectedGroup).toHaveBeenCalledWith(null);
  });

  it('should throw for invalid groupId types', async () => {
    const action = createTestAction({
      definition: { type: 'group.selected.update', groupId: '15' },
    });

    await expect(action({})).rejects.toStrictEqual(
      new ActionError({
        cause: 'Expected groupId to be a number or null, got: "15"',
        data: {},
        definition: { type: 'group.selected.update', groupId: '15' },
      }),
    );
  });

  it('should throw if group does not exist in app member groups', async () => {
    const action = createTestAction({
      definition: { type: 'group.selected.update', groupId: 99 },
      appMemberGroups: [{ id: 15, name: 'Test Group', role: 'Member' }],
    });

    await expect(action({})).rejects.toStrictEqual(
      new ActionError({
        cause: 'Group with id 99 was not found.',
        data: {},
        definition: { type: 'group.selected.update', groupId: 99 },
      }),
    );
  });
});
