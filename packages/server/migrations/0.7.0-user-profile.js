const Sequelize = require('sequelize');

module.exports = {
  key: '0.7.0',
  async up(db, DataTypes) {
    const queryInterface = db.getQueryInterface();
    const { User, EmailAuthorization } = db.models;

    queryInterface.addColumn('User', 'name', { type: DataTypes.STRING });
    queryInterface.addColumn('User', 'password', { type: DataTypes.STRING });
    queryInterface.addColumn('User', 'primaryEmail', {
      type: DataTypes.STRING,
      references: { model: 'EmailAuthorization', key: 'email' },
    });

    const emailAuthorizations = await queryInterface.select(
      EmailAuthorization,
      'EmailAuthorization',
    );
    emailAuthorizations.forEach(emailAuthorization => {
      queryInterface.update(
        User,
        'User',
        {
          password: emailAuthorization.dataValues.password,
          primaryEmail: emailAuthorization.dataValues.email,
        },
        { id: emailAuthorization.UserId },
      );
    });

    queryInterface.removeColumn('EmailAuthorization', 'password');
    queryInterface.removeColumn('EmailAuthorization', 'name');
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    const { User, EmailAuthorization } = db.models;

    queryInterface.addColumn('EmailAuthorization', 'name', { type: Sequelize.DataTypes.STRING });
    queryInterface.addColumn('EmailAuthorization', 'password', {
      type: Sequelize.DataTypes.STRING,
    });

    const users = await queryInterface.select(User, 'User');
    users.forEach(user => {
      if (user.dataValues.primaryEmail) {
        queryInterface.bulkDelete('EmailAuthorization', {
          [Sequelize.Op.not]: { email: user.dataValues.primaryEmail },
        });

        queryInterface.update(
          EmailAuthorization,
          'EmailAuthorization',
          { name: user.dataValues.name, password: user.dataValues.password },
          { email: user.dataValues.primaryEmail },
        );
      }
    });

    queryInterface.removeColumn('User', 'name');
    queryInterface.removeColumn('User', 'password');
    queryInterface.removeConstraint('User', 'User_primaryEmail_foreign_idx');
    queryInterface.removeColumn('User', 'primaryEmail');
  },
};
