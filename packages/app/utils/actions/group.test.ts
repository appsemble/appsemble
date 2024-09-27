import { describe, expect, it } from 'vitest';

import { createTestAction } from '../makeActions.js';

describe('group', () => {
  it('should make a get request to fetch user groups', async () => {
    const action = createTestAction({
      definition: { type: 'group.query' },
      appMemberGroups: [{ id: 2, name: 'Test Group', role: 'Member' }],
    });
    const result = await action('Test');
    expect(result).toStrictEqual([{ id: 2, name: 'Test Group', role: 'Member' }]);
  });
});
