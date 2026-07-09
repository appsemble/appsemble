import { Op } from 'sequelize';
import { describe, expect, it, vi } from 'vitest';

import {
  normalizeLoginGroups,
  normalizeLoginRoleMappings,
  resolveLoginRoleMappings,
  syncLoginRoleMappings,
  validateLoginRoleMappings,
} from './loginRoleMappings.js';

describe('loginRoleMappings', () => {
  it('should normalize login groups', () => {
    expect(normalizeLoginGroups([' /Admin ', '', '/Admin', '/Users'])).toStrictEqual([
      '/Admin',
      '/Users',
    ]);
    expect(normalizeLoginGroups('/Group')).toStrictEqual(['/Group']);
    expect(normalizeLoginGroups(null)).toStrictEqual([]);
  });

  it('should normalize login role mappings', () => {
    expect(
      normalizeLoginRoleMappings([
        { group: ' /Admin ', role: 'Manager' },
        { group: '/Admin', role: 'Manager' },
        { group: '/Users', role: 'Member' },
      ]),
    ).toStrictEqual([
      { group: '/Admin', role: 'Manager' },
      { group: '/Users', role: 'Member' },
    ]);
    expect(normalizeLoginRoleMappings([])).toBeUndefined();
  });

  it('should resolve exact role mappings and dedupe roles', () => {
    expect(
      resolveLoginRoleMappings(
        ['/Admin', '/Users', '/Extra'],
        [
          { group: '/Admin', role: 'Manager' },
          { group: '/Users', role: 'Member' },
          { group: '/Extra', role: 'Manager' },
        ],
      ),
    ).toStrictEqual([
      { externalGroup: '/Admin', role: 'Manager' },
      { externalGroup: '/Users', role: 'Member' },
    ]);
  });

  it('should match configured mapping groups with surrounding whitespace', () => {
    expect(
      resolveLoginRoleMappings(
        ['/Admin'],
        [{ group: ' /Admin ', role: 'Manager' }],
      ),
    ).toStrictEqual([{ externalGroup: '/Admin', role: 'Manager' }]);
  });

  it('should preserve exact keycloak path groups', () => {
    expect(
      resolveLoginRoleMappings(
        ['/Parent/Child', '/Parent'],
        [
          { group: '/Parent', role: 'ParentRole' },
          { group: '/Parent/Child', role: 'ChildRole' },
        ],
      ),
    ).toStrictEqual([
      { externalGroup: '/Parent', role: 'ParentRole' },
      { externalGroup: '/Parent/Child', role: 'ChildRole' },
    ]);
  });

  it('should validate role mappings', () => {
    expect(validateLoginRoleMappings(undefined, ['Manager', 'Member'])).toBeNull();
    expect(validateLoginRoleMappings({}, ['Manager', 'Member'])).toBe(
      'Role mappings must be an array',
    );
    expect(validateLoginRoleMappings([{ group: '', role: 'Manager' }], ['Manager', 'Member'])).toBe(
      'Role mapping 1 must define a non-empty group',
    );
    expect(
      validateLoginRoleMappings([{ group: '/Admin', role: 'Unknown' }], ['Manager', 'Member']),
    ).toBe("Role mapping 1 has unknown role 'Unknown'");
  });

  it('should preserve non-synced roles while replacing synced roles atomically', async () => {
    const findAll = vi.fn().mockResolvedValue([{ role: 'Manager' }]);
    const destroy = vi.fn().mockResolvedValue(1);
    const bulkCreate = vi.fn().mockResolvedValue([]);
    const reload = vi.fn().mockImplementation(() => Promise.resolve());
    const transaction = { id: 'txn' };
    const transactionRunner = vi
      .fn()
      .mockImplementation((callback: (t: unknown) => Promise<unknown>) => callback(transaction));

    await syncLoginRoleMappings(
      {
        bulkCreate,
        destroy,
        findAll,
        sequelize: { transaction: transactionRunner },
      } as never,
      { id: 'member-id', reload } as never,
      [
        { externalGroup: '/Managers', role: 'Manager' },
        { externalGroup: '/Editors', role: 'Editor' },
      ],
    );

    expect(findAll).toHaveBeenCalledWith({
      attributes: ['role'],
      where: {
        AppMemberId: 'member-id',
        source: {
          [Op.ne]: 'group-sync',
        },
      },
    });
    // Destroy and bulkCreate must run inside a single managed transaction.
    expect(transactionRunner).toHaveBeenCalledOnce();
    expect(destroy).toHaveBeenCalledWith({
      where: {
        AppMemberId: 'member-id',
        source: 'group-sync',
      },
      transaction,
    });
    // The preserved 'Manager' role is filtered out; only 'Editor' is inserted.
    expect(bulkCreate).toHaveBeenCalledWith(
      [
        {
          AppMemberId: 'member-id',
          externalGroup: '/Editors',
          role: 'Editor',
          source: 'group-sync',
        },
      ],
      { transaction },
    );
    expect(reload).toHaveBeenCalledWith();
  });
});
