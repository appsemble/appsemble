import { DataTypes } from 'sequelize';

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

    const apps = await db.query(
      "SELECT * FROM `App` WHERE JSON_CONTAINS(definition, ?, '$.private')",
      { replacements: ['true'], type: db.QueryTypes.SELECT },
    );

    await Promise.all(
      apps.map(({ id }) =>
        db.query(
          "UPDATE `App` SET private = true, definition = JSON_REMOVE(`definition`, '$.private'), yaml = REPLACE(yaml, 'private: true', '') WHERE id = ?",
          {
            replacements: [id],
            type: db.QueryTypes.UPDATE,
          },
        ),
      ),
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
    await queryInterface.addColumn('App', 'description', {
      type: DataTypes.STRING(80),
      allowNull: true,
    });
  },
};
