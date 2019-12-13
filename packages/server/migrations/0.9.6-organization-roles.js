import { DataTypes } from 'sequelize';

export default {
  key: '0.9.6',

  async up(db) {
    const queryInterface = db.getQueryInterface();
    await queryInterface.addColumn('Member', 'role', {
      type: DataTypes.ENUM('Member', 'Owner', 'Maintainer', 'AppEditor'),
      defaultValue: 'Member',
      allowNull: false,
    });

    await db.query('UPDATE "Member" SET "role" = ?', {
      replacements: ['Owner'],
      type: db.QueryTypes.UPDATE,
    });
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    await queryInterface.removeColumn('Member', 'role');
    await db.query('DROP TYPE IF EXISTS "enum_Member_role"');
  },
};
