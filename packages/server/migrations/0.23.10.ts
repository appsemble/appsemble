import { logger } from '@appsemble/node-utils';
import { type Sequelize } from 'sequelize';

export const key = '0.23.10';

/**
 * Summary:
 * - Rename table and constraints from "Member" to "OrganizationMember"
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Renaming table "Member" to "OrganizationMember"');
  await queryInterface.renameTable('Member', 'OrganizationMember');

  logger.info('Renaming primary key "Member_pkey" to "OrganizationMember_pkey"');
  await queryInterface.removeConstraint('OrganizationMember', 'Member_pkey');
  await queryInterface.addConstraint('OrganizationMember', {
    fields: ['OrganizationId', 'UserId'],
    type: 'primary key',
    name: 'OrganizationMember_pkey',
  });

  logger.info(
    'Renaming foreign key "Member_OrganizationId_fkey" to "OrganizationMember_OrganizationId_fkey"',
  );
  await queryInterface.removeConstraint('OrganizationMember', 'Member_OrganizationId_fkey');
  await queryInterface.addConstraint('OrganizationMember', {
    fields: ['OrganizationId'],
    type: 'foreign key',
    name: 'OrganizationMember_OrganizationId_fkey',
    onUpdate: 'cascade',
    onDelete: 'cascade',
    references: {
      table: 'Organization',
      field: 'id',
    },
  });

  logger.info('Renaming foreign key "Member_UserId_fkey" to "OrganizationMember_UserId_fkey"');
  await queryInterface.removeConstraint('OrganizationMember', 'Member_UserId_fkey');
  await queryInterface.addConstraint('OrganizationMember', {
    fields: ['UserId'],
    type: 'foreign key',
    name: 'OrganizationMember_UserId_fkey',
    onUpdate: 'cascade',
    onDelete: 'cascade',
    references: {
      table: 'User',
      field: 'id',
    },
  });
}

/**
 * Summary:
 * - Rename table and constraints from "OrganizationMember" to "Member"
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Renaming table "OrganizationMember" to "Member"');
  await queryInterface.renameTable('OrganizationMember', 'Member');

  logger.info('Renaming primary key "OrganizationMember_pkey" to "Member_pkey"');
  await queryInterface.removeConstraint('Member', 'OrganizationMember_pkey');
  await queryInterface.addConstraint('Member', {
    fields: ['OrganizationId', 'UserId'],
    type: 'primary key',
    name: 'Member_pkey',
  });

  logger.info(
    'Renaming foreign key "OrganizationMember_OrganizationId_fkey" to "Member_OrganizationId_fkey"',
  );
  await queryInterface.removeConstraint('Member', 'OrganizationMember_OrganizationId_fkey');
  await queryInterface.addConstraint('Member', {
    fields: ['OrganizationId'],
    type: 'foreign key',
    name: 'Member_OrganizationId_fkey',
    onUpdate: 'cascade',
    onDelete: 'cascade',
    references: {
      table: 'Organization',
      field: 'id',
    },
  });

  logger.info('Renaming foreign key "OrganizationMember_UserId_fkey" to "Member_UserId_fkey"');
  await queryInterface.removeConstraint('Member', 'OrganizationMember_UserId_fkey');
  await queryInterface.addConstraint('Member', {
    fields: ['UserId'],
    type: 'foreign key',
    name: 'Member_UserId_fkey',
    onUpdate: 'cascade',
    onDelete: 'cascade',
    references: {
      table: 'User',
      field: 'id',
    },
  });
}
