import { describe, expect, it, vi } from 'vitest';

import { Organization } from './Organization.js';

const { bulkCreate, create, info } = vi.hoisted(() => ({
  bulkCreate: vi.fn(() => Promise.resolve([])),
  create: vi.fn(() => Promise.resolve({ id: 1 })),
  info: vi.fn(),
}));

vi.mock('@appsemble/node-utils', () => ({
  logger: {
    info,
  },
}));

vi.mock('./OrganizationSubscription.js', () => ({
  OrganizationSubscription: {
    bulkCreate,
    create,
  },
}));

describe('Organization hooks', () => {
  it('passes the transaction to the default subscription create hook', async () => {
    const transaction = {};

    await Organization.afterCreateHook(
      { id: 'appsemble' } as Organization,
      { transaction } as never,
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        OrganizationId: 'appsemble',
      }),
      { transaction },
    );
  });

  it('passes the transaction to the default subscription bulk create hook', async () => {
    const transaction = {};

    await Organization.afterBulkCreateHook(
      [{ id: 'appsemble' }, { id: 'review' }] as Organization[],
      { transaction } as never,
    );

    expect(bulkCreate).toHaveBeenCalledWith(
      [
        expect.objectContaining({ OrganizationId: 'appsemble' }),
        expect.objectContaining({ OrganizationId: 'review' }),
      ],
      { transaction },
    );
  });
});
