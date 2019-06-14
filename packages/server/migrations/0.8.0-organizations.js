import { DataTypes, Op } from 'sequelize';

export default {
  key: '0.8.0',

  async up(db) {
    const queryInterface = db.getQueryInterface();

    await queryInterface.renameTable('UserOrganization', 'Member');
    await queryInterface.addColumn('Member', 'verified', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
    await queryInterface.addColumn('Member', 'key', { type: DataTypes.STRING });

    // Hard delete any remaining soft deleted entries
    await queryInterface.bulkDelete('Member', { deleted: { [Op.ne]: null } });
    await queryInterface.removeColumn('Member', 'deleted');

    await queryInterface.addColumn('Organization', 'name', { type: DataTypes.STRING });
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();

    await queryInterface.removeColumn('Member', 'key');
    await queryInterface.removeColumn('Member', 'verified');
    await queryInterface.addColumn('Member', 'deleted', { allowNull: true, type: DataTypes.DATE });
    await queryInterface.renameTable('Member', 'UserOrganization');

    await queryInterface.removeColumn('Organization', 'name');
  },
};
