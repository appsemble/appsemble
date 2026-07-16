import { Op } from 'sequelize';
import { describe, expect, it } from 'vitest';

import {
  normalizeLoginGroups,
  normalizeLoginRoleMappings,
  resolveLoginRoleMappings,
  syncLoginRoleMappings,
  validateLoginRoleMappings,
} from './loginRoleMappings.js';

interface AppMemberAssignedRoleRow {
  AppMemberId: string;
  role: string;
  source: string;
  externalGroup?: string;
}

interface FakeAssignedRoleModel {
  sequelize: {
    transaction: (callback: (transaction: unknown) => Promise<unknown>) => Promise<unknown>;
  };
  findAll: (query: { where: Record<string, unknown> }) => Promise<AppMemberAssignedRoleRow[]>;
  destroy: (query: { where: Record<string, unknown> }) => Promise<number>;
  bulkCreate: (rows: AppMemberAssignedRoleRow[]) => Promise<AppMemberAssignedRoleRow[]>;
}

/**
 * Build an in-memory stand-in for the AppMemberAssignedRole repository that honors the
 * transaction semantics `syncLoginRoleMappings` relies on: mutations made inside a
 * `sequelize.transaction` callback are rolled back when the callback throws.
 *
 * @param initialRows The rows the member starts with.
 * @returns The fake repository and its backing store, so tests can assert on the end state.
 */
function createAppMemberAssignedRoleStore(initialRows: AppMemberAssignedRoleRow[]): {
  model: FakeAssignedRoleModel;
  store: { rows: AppMemberAssignedRoleRow[] };
} {
  const store = { rows: initialRows.map((row) => ({ ...row })) };

  const matches = (row: AppMemberAssignedRoleRow, where: Record<string, unknown>): boolean =>
    Object.entries(where).every(([key, value]) => {
      if (value != null && typeof value === 'object' && Op.ne in value) {
        return (
          row[key as keyof AppMemberAssignedRoleRow] !== (value as Record<symbol, unknown>)[Op.ne]
        );
      }
      return row[key as keyof AppMemberAssignedRoleRow] === value;
    });

  const model: FakeAssignedRoleModel = {
    sequelize: {
      async transaction(callback: (transaction: unknown) => Promise<unknown>): Promise<unknown> {
        const snapshot = store.rows.map((row) => ({ ...row }));
        try {
          return await callback({ id: 'txn' });
        } catch (error) {
          store.rows = snapshot;
          throw error;
        }
      },
    },
    findAll({ where }: { where: Record<string, unknown> }): Promise<AppMemberAssignedRoleRow[]> {
      return Promise.resolve(store.rows.filter((row) => matches(row, where)));
    },
    destroy({ where }: { where: Record<string, unknown> }): Promise<number> {
      const before = store.rows.length;
      store.rows = store.rows.filter((row) => !matches(row, where));
      return Promise.resolve(before - store.rows.length);
    },
    bulkCreate(rows: AppMemberAssignedRoleRow[]): Promise<AppMemberAssignedRoleRow[]> {
      store.rows.push(...rows.map((row) => ({ ...row })));
      return Promise.resolve(rows);
    },
  };

  return { model, store };
}

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
      resolveLoginRoleMappings(['/Admin'], [{ group: ' /Admin ', role: 'Manager' }]),
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

  it('should replace synced roles while preserving externally assigned roles', async () => {
    // A Manager granted outside group sync must survive, while a stale group-sync
    // role is removed and the newly matched Editor role is inserted.
    const { model, store } = createAppMemberAssignedRoleStore([
      { AppMemberId: 'member-id', role: 'Manager', source: 'oauth2' },
      { AppMemberId: 'member-id', role: 'Viewer', source: 'group-sync', externalGroup: '/Legacy' },
    ]);

    await syncLoginRoleMappings(
      model as never,
      { id: 'member-id', reload: () => Promise.resolve() } as never,
      [
        { externalGroup: '/Managers', role: 'Manager' },
        { externalGroup: '/Editors', role: 'Editor' },
      ],
    );

    // The externally assigned Manager stays; Manager is not duplicated as a
    // group-sync role, the stale Viewer role is gone, and Editor is added.
    expect(store.rows).toStrictEqual([
      { AppMemberId: 'member-id', role: 'Manager', source: 'oauth2' },
      { AppMemberId: 'member-id', externalGroup: '/Editors', role: 'Editor', source: 'group-sync' },
    ]);
  });

  it('should leave existing roles untouched when inserting new roles fails', async () => {
    const { model, store } = createAppMemberAssignedRoleStore([
      { AppMemberId: 'member-id', role: 'Viewer', source: 'group-sync', externalGroup: '/Legacy' },
    ]);
    const initialRows = store.rows.map((row) => ({ ...row }));
    model.bulkCreate = () => Promise.reject(new Error('insert failed'));

    await expect(
      syncLoginRoleMappings(
        model as never,
        { id: 'member-id', reload: () => Promise.resolve() } as never,
        [{ externalGroup: '/Editors', role: 'Editor' }],
      ),
    ).rejects.toThrow('insert failed');

    // The destroy and insert share one transaction, so a failed insert rolls the
    // removal back and the member keeps its original roles.
    expect(store.rows).toStrictEqual(initialRows);
  });
});
