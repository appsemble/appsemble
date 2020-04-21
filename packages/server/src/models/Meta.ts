import { DataTypes, Model, Sequelize } from 'sequelize';

/**
 * Define database metadata.
 */
export default class Meta extends Model {
  version: string;

  static initialize(sequelize: Sequelize): void {
    Meta.init(
      {
        /**
         * The current version of the database.
         *
         * This field _**must**_ stay consistent across versions!
         */
        version: { type: DataTypes.STRING(11), primaryKey: true },
      },
      {
        sequelize,
        tableName: 'Meta',
        timestamps: false,
      },
    );
  }
}
