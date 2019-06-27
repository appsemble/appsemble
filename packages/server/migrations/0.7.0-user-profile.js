import { DataTypes, Op } from 'sequelize';

export default {
  key: '0.7.0',
  async up(db) {
    const queryInterface = db.getQueryInterface();
    const { User, EmailAuthorization } = db.models;

    await queryInterface.addColumn('User', 'name', { type: DataTypes.STRING });
    await queryInterface.addColumn('User', 'password', { type: DataTypes.STRING });
    await queryInterface.addColumn('User', 'primaryEmail', {
      type: DataTypes.STRING,
      references: { model: 'EmailAuthorization', key: 'email' },
    });

    await queryInterface.addColumn('ResetPasswordToken', 'UserId', {
      type: DataTypes.INTEGER,
      allowNull: false,
      onDelete: 'CASCADE',
      references: {
        model: 'User',
        key: 'id',
      },
    });

    await queryInterface.removeColumn('ResetPasswordToken', 'EmailAuthorizationEmail');

    const emailAuthorizations = await queryInterface.select(
      EmailAuthorization,
      'EmailAuthorization',
    );

    await Promise.all(
      emailAuthorizations.map(emailAuthorization =>
        queryInterface.update(
          User,
          'User',
          {
            name: emailAuthorization.dataValues.name,
            password: emailAuthorization.dataValues.password,
            primaryEmail: emailAuthorization.dataValues.email,
          },
          { id: emailAuthorization.dataValues.UserId },
        ),
      ),
    );

    await queryInterface.removeColumn('EmailAuthorization', 'password');
    await queryInterface.removeColumn('EmailAuthorization', 'name');
    await queryInterface.removeColumn('EmailAuthorization', 'deleted');
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    const { User, EmailAuthorization } = db.models;

    await queryInterface.addColumn('EmailAuthorization', 'name', {
      type: DataTypes.STRING,
    });
    await queryInterface.addColumn('EmailAuthorization', 'password', {
      type: DataTypes.STRING,
    });

    const users = await queryInterface.select(User, 'User');
    await Promise.all(
      users
        .filter(user => user.dataValues.primaryEmail)
        .map(async user => {
          await queryInterface.bulkDelete('EmailAuthorization', {
            [Op.not]: { email: user.dataValues.primaryEmail },
          });

          return queryInterface.update(
            EmailAuthorization,
            'EmailAuthorization',
            { name: user.dataValues.name, password: user.dataValues.password },
            { email: user.dataValues.primaryEmail },
          );
        }),
    );

    await queryInterface.removeColumn('ResetPasswordToken', 'UserId');
    await queryInterface.addColumn('ResetPasswordToken', 'EmailAuthorizationEmail', {
      type: DataTypes.STRING,
      allowNull: false,
      onDelete: 'CASCADE',
      references: {
        model: 'EmailAuthorization',
        key: 'email',
      },
    });

    await queryInterface.removeColumn('User', 'name');
    await queryInterface.removeColumn('User', 'password');
    await queryInterface.removeColumn('User', 'primaryEmail');
    await queryInterface.addColumn('EmailAuthorization', 'deleted', {
      type: DataTypes.DATE,
    });
  },
};
