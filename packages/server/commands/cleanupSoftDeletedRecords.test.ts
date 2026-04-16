import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanupSoftDeletedRecords } from './cleanupSoftDeletedRecords.js';
import { App, Organization, User } from '../models/index.js';

vi.mock('../models/index.js', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    getAppDB: vi.fn().mockResolvedValue({
      Asset: { destroy: vi.fn().mockResolvedValue(1) },
      Resource: { destroy: vi.fn().mockResolvedValue(1) },
      sequelize: {
        transaction: vi.fn((cb) => cb('appTransaction')),
        close: vi.fn().mockReturnValue(Promise.resolve()),
      },
    }),
  };
});

describe('cleanupSoftDeletedRecords', () => {
  const now = new Date('2026-04-16T12:00:00Z').getTime();
  const olderThan90Days = new Date(now - 91 * 24 * 60 * 60 * 1000);
  const newerThan90Days = new Date(now - 89 * 24 * 60 * 60 * 1000);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should delete records older than 90 days', async () => {
    const org = await Organization.create({ id: 'test-org', name: 'Test Org' });

    await App.create({
      id: 1,
      name: 'Old App',
      deleted: olderThan90Days,
      OrganizationId: org.id,
      path: 'old-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      definition: { name: 'Old App' },
    } as any);
    await App.create({
      id: 2,
      name: 'New App',
      deleted: newerThan90Days,
      OrganizationId: org.id,
      path: 'new-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      definition: { name: 'New App' },
    } as any);

    await Organization.create({
      id: 'old-org',
      name: 'Old Org',
      deleted: olderThan90Days,
    } as any);
    await Organization.create({
      id: 'new-org',
      name: 'New Org',
      deleted: newerThan90Days,
    } as any);

    await User.create({
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Old User',
      primaryEmail: 'old@example.com',
      deleted: olderThan90Days,
      timezone: 'UTC',
    } as any);
    await User.create({
      id: '00000000-0000-4000-8000-000000000002',
      name: 'New User',
      primaryEmail: 'new@example.com',
      deleted: newerThan90Days,
      timezone: 'UTC',
    } as any);

    await cleanupSoftDeletedRecords();

    const apps = await App.findAll({ paranoid: false });
    expect(apps).toHaveLength(1);

    const oldApp = await App.findByPk(1, { paranoid: false });
    expect(oldApp).toBeNull();

    const newApp = await App.findByPk(2, { paranoid: false });
    expect(newApp).not.toBeNull();

    const oldOrg = await Organization.findByPk('old-org', { paranoid: false });
    expect(oldOrg).toBeNull();

    const newOrg = await Organization.findByPk('new-org', { paranoid: false });
    expect(newOrg).not.toBeNull();

    const oldUser = await User.findByPk('00000000-0000-4000-8000-000000000001', {
      paranoid: false,
    });
    expect(oldUser).toBeNull();

    const newUser = await User.findByPk('00000000-0000-4000-8000-000000000002', {
      paranoid: false,
    });
    expect(newUser).not.toBeNull();
  });

  it('should handle errors during app cleanup', async () => {
    const { getAppDB } = await import('../models/index.js');
    (getAppDB as any).mockRejectedValueOnce(new Error('DB connection failed'));

    const org = await Organization.create({ id: 'test-org-2', name: 'Test Org 2' });
    await App.create({
      id: 3,
      name: 'App 3',
      OrganizationId: org.id,
      path: 'app-3',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      definition: { name: 'App 3' },
    } as any);

    // This should not throw, but log a warning and continue
    await cleanupSoftDeletedRecords();

    const apps = await App.findAll({ paranoid: false });
    expect(apps).toContainEqual(expect.objectContaining({ id: 3 }));
  });
});
