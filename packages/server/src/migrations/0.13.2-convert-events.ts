import { logger } from '@appsemble/node-utils';
import { QueryTypes } from 'sequelize';

import type { Migration } from '../utils/migrate';

export default {
  key: '0.13.2',

  /**
   * Summary:
   * - Query all blocks with events
   * - Parse them back into JS objects
   * - Convert all event emitters and listeners to empty objects
   */
  async up(db) {
    const blocks = await db.query<{
      OrganizationId: string;
      name: string;
      version: string;
      events: { listen?: string[]; emit?: string[] };
    }>(
      'SELECT "OrganizationId", name, version, events FROM "BlockVersion" WHERE events IS NOT NULL',
      {
        raw: true,
        type: QueryTypes.SELECT,
      },
    );

    logger.info(`Updating ${blocks.length} blocks`);
    for (const block of blocks) {
      logger.info(`Updating @${block.OrganizationId}/${block.name}@${block.version}`);
      const { events } = block;
      const listen =
        events.listen?.length &&
        Object.fromEntries(events.listen.map((entry: string) => [entry, {}]));

      const emit =
        events.emit?.length && Object.fromEntries(events.emit.map((entry: string) => [entry, {}]));

      const newEvents = JSON.stringify({ ...(emit && { emit }), ...(listen && { listen }) });
      await db.query(
        'UPDATE "BlockVersion" SET events = ? WHERE name = ? AND "OrganizationId" = ? AND version = ?',
        {
          replacements: [newEvents, block.name, block.OrganizationId, block.version],
          type: QueryTypes.UPDATE,
        },
      );
    }
  },

  async down(db) {
    const blocks = await db.query<{
      OrganizationId: string;
      name: string;
      version: string;
      events: { listen?: { [key: string]: {} }; emit?: { [key: string]: {} } };
    }>(
      'SELECT "OrganizationId", name, version, events FROM "BlockVersion" WHERE events IS NOT NULL',
      {
        raw: true,
        type: QueryTypes.SELECT,
      },
    );

    logger.info(`Updating ${blocks.length} blocks`);
    for (const block of blocks) {
      logger.info(`Updating @${block.OrganizationId}/${block.name}@${block.version}`);
      const { events } = block;
      const listen = Object.keys(events.listen || {});
      const emit = Object.keys(events.emit || {});

      const newEvents = JSON.stringify({
        ...(emit.length && { emit }),
        ...(listen.length && { listen }),
      });
      await db.query(
        'UPDATE "BlockVersion" SET events = ? WHERE name = ? AND "OrganizationId" = ? AND version = ?',
        {
          replacements: [newEvents, block.name, block.OrganizationId, block.version],
          type: QueryTypes.UPDATE,
        },
      );
    }
  },
} as Migration;
