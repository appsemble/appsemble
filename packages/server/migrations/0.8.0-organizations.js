import { DataTypes } from 'sequelize';

export default {
  key: '0.8.0',

  async up(db) {
    const queryInterface = db.getQueryInterface();
    const { Member, Organization } = db.models;

    await queryInterface.renameTable('UserOrganization', 'Member');
    await queryInterface.addColumn('Member', 'verified', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
    await queryInterface.addColumn('Member', 'key', { type: DataTypes.STRING });
    await queryInterface.addColumn('Member', 'email', { type: DataTypes.STRING });

    // All current members are automatically considered verified
    // Member.update and queryInterface.bulkUpdate are not used due to a bug with the MySQL provider
    // See: https://github.com/sequelize/sequelize/issues/10625
    const members = await Member.findAll();
    await Promise.all(members.map(member => member.update({ verified: true })));

    await queryInterface.addColumn('Organization', 'name', { type: DataTypes.STRING });
    const organizations = await Organization.findAll();
    await Promise.all(
      organizations.map(organization => organization.update({ name: organization.id })),
    );
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();

    // Remove any remaining unverified members
    await queryInterface.bulkDelete('Member', { verified: false });

    await queryInterface.removeColumn('Member', 'key');
    await queryInterface.removeColumn('Member', 'email');
    await queryInterface.removeColumn('Member', 'verified');
    await queryInterface.renameTable('Member', 'UserOrganization');

    await queryInterface.removeColumn('Organization', 'name');
  },
};
