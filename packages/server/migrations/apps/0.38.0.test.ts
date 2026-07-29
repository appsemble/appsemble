import { QueryTypes } from 'sequelize';
import { describe, expect, it } from 'vitest';

import { up } from './0.38.0.js';
import { App, getAppDB, Organization } from '../../models/index.js';

async function seedApp(): Promise<number> {
  await Organization.create({ id: 'testorganization', name: 'Test Organization' });
  const app = await App.create({
    OrganizationId: 'testorganization',
    definition: { name: 'Test App', defaultPage: 'Test' },
    path: 'test-app',
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
  });
  return app.id;
}

describe('migration 0.38.0', () => {
  it('converts Resource into a LIST-partitioned table, preserving and routing existing rows', async () => {
    const appId = await seedApp();
    const { sequelize } = await getAppDB(appId);

    // Seed old-shape rows in the single Resource table (as it exists pre-0.38.0).
    await sequelize.query(`
      INSERT INTO "Resource" (type, data, created, updated) VALUES
        ('training', '{"title":"algebra"}', now(), now()),
        ('training', '{"title":"calculus"}', now(), now()),
        ('course',   '{"trainingId":1,"name":"c1"}', now(), now())`);

    await sequelize.transaction((transaction) => up(transaction, sequelize));

    // Resource is now a partitioned table (relkind 'p').
    const [{ relkind }] = await sequelize.query<{ relkind: string }>(
      `SELECT relkind FROM pg_class WHERE relname = 'Resource'`,
      { type: QueryTypes.SELECT },
    );
    expect(relkind).toBe('p');

    // Rows are preserved and each type lives in its own partition.
    const grouped = await sequelize.query<{ partition: string; type: string; c: number }>(
      `SELECT (tableoid::regclass)::text AS partition, type, count(*)::int AS c
         FROM "Resource" GROUP BY 1, 2 ORDER BY type`,
      { type: QueryTypes.SELECT },
    );
    expect(grouped).toHaveLength(2);
    const course = grouped.find((r) => r.type === 'course')!;
    const training = grouped.find((r) => r.type === 'training')!;
    expect(course.c).toBe(1);
    expect(training.c).toBe(2);
    expect(course.partition).not.toBe(training.partition);

    // Payload survives intact.
    const [row] = await sequelize.query<{ data: { name: string } }>(
      `SELECT data FROM "Resource" WHERE type = 'course'`,
      { type: QueryTypes.SELECT },
    );
    expect(row.data.name).toBe('c1');
  });
});
