import { DataTypes } from 'sequelize';

export default {
  key: '0.8.3',

  async up(db) {
    const queryInterface = db.getQueryInterface();
    const invites = await db.query('SELECT * FROM `Member` WHERE verified = ?', {
      replacements: [false],
      type: db.QueryTypes.SELECT,
    });

    await queryInterface.createTable(
      'OrganizationInvite',
      {
        email: { type: DataTypes.STRING, allowNull: false },
        key: { type: DataTypes.STRING },
        OrganizationId: {
          type: DataTypes.STRING,
          references: {
            model: 'Organization',
            key: 'id',
          },
        },
        UserId: {
          type: DataTypes.INTEGER,
          references: {
            model: 'User',
            key: 'id',
          },
        },
        created: { allowNull: false, type: DataTypes.DATE },
        updated: { allowNull: false, type: DataTypes.DATE },
      },
      {
        uniqueKeys: [{ name: 'EmailOrganizationIndex', fields: ['email', 'OrganizationId'] }],
      },
    );

    await queryInterface.bulkInsert(
      'OrganizationInvite',
      invites.map(invite => ({
        email: invite.email,
        key: invite.key,
        OrganizationId: invite.OrganizationId,
        UserId: invite.UserId,
        created: invite.created,
        updated: invite.updated,
      })),
    );

    await queryInterface.bulkDelete('Member', { verified: false });
    await queryInterface.removeColumn('Member', 'key');
    await queryInterface.removeColumn('Member', 'email');
    await queryInterface.removeColumn('Member', 'verified');
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();

    await queryInterface.addColumn('Member', 'key', {
      allowNull: false,
      type: DataTypes.STRING,
    });

    await queryInterface.addColumn('Member', 'email', {
      allowNull: false,
      type: DataTypes.STRING,
    });

    await queryInterface.addColumn('Member', 'verified', {
      allowNull: false,
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    });

    const invites = await db.query('SELECT * FROM `OrganizationInvite`', {
      type: db.QueryTypes.SELECT,
    });

    const members = await db.query('SELECT * FROM `Member`');
    await Promise.all(
      members.map(member => queryInterface.update(member, 'Member', { verified: true })),
    );

    await queryInterface.bulkInsert(
      'Member',
      invites.map(invite => ({
        verified: false,
        key: invite.key,
        email: invite.email,
        UserId: invite.UserId,
        OrganizationId: invite.OrganizationId,
        created: invite.created,
        updated: invite.updated,
      })),
    );

    await queryInterface.dropTable('OrganizationInvite');
  },
};
