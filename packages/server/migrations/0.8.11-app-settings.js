import { DataTypes } from 'sequelize';
import { generateVAPIDKeys } from 'web-push';

export default {
  key: '0.8.11',

  async up(db) {
    const queryInterface = db.getQueryInterface();

    await queryInterface.removeColumn('App', 'description');
    await queryInterface.addColumn('App', 'domain', {
      type: DataTypes.STRING(253),
      allowNull: true,
    });
    await queryInterface.addColumn('App', 'private', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
    await queryInterface.addColumn('App', 'vapidPublicKey', {
      type: DataTypes.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('App', 'vapidPrivateKey', {
      type: DataTypes.STRING,
      allowNull: false,
    });

    const privateApp = await db.query(
      "SELECT * FROM `App` WHERE JSON_CONTAINS(definition, ?, '$.private')",
      { replacements: ['true'], type: db.QueryTypes.SELECT },
    );

    await Promise.all(
      privateApp.map(({ id }) =>
        db.query(
          "UPDATE `App` SET private = true, definition = JSON_REMOVE(`definition`, '$.private'), yaml = REPLACE(yaml, 'private: true', '') WHERE id = ?",
          {
            replacements: [id],
            type: db.QueryTypes.UPDATE,
          },
        ),
      ),
    );

    await queryInterface.createTable('AppSubscription', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      endpoint: { type: DataTypes.STRING, allowNull: false },
      p256dh: { type: DataTypes.STRING, allowNull: false },
      auth: { type: DataTypes.STRING, allowNull: false },
      AppId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'App',
          key: 'id',
        },
      },
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'User',
          key: 'id',
        },
      },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
      deleted: { allowNull: true, type: DataTypes.DATE },
    });

    const allApps = await db.query('SELECT id FROM `App`', {
      raw: true,
      type: db.QueryTypes.SELECT,
    });
    await Promise.all(
      allApps.map(({ id }) => {
        const keys = generateVAPIDKeys();
        return db.query('UPDATE `App` SET vapidPublicKey = ?, vapidPrivateKey = ? WHERE id = ?', {
          replacements: [keys.publicKey, keys.privateKey, id],
          type: db.QueryTypes.UPDATE,
        });
      }),
    );
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();

    // Query all apps that are set to private and manually set private property
    const apps = await db.query('SELECT * FROM `App` WHERE private = ?', {
      replacements: [true],
      type: db.QueryTypes.SELECT,
    });

    await Promise.all(
      apps.map(({ id }) =>
        db.query(
          "UPDATE `App` SET definition = JSON_INSERT(`definition`, '$.private', true), yaml = CONCAT('private: true', CHAR(13), yaml) WHERE id = ?",
          { replacements: [id], type: db.QueryTypes.UPDATE },
        ),
      ),
    );

    await queryInterface.removeColumn('App', 'domain');
    await queryInterface.removeColumn('App', 'private');
    await queryInterface.removeColumn('App', 'vapidPublicKey');
    await queryInterface.removeColumn('App', 'vapidPrivateKey');
    await queryInterface.addColumn('App', 'description', {
      type: DataTypes.STRING(80),
      allowNull: true,
    });
    await queryInterface.dropTable('AppSubscription');
  },
};
