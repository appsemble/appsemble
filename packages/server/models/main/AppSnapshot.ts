import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Index,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import { App, User } from '../index.js';

@Table({ tableName: 'AppSnapshot', updatedAt: false })
export class AppSnapshot extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare yaml: string;

  @CreatedAt
  @Index({ name: 'appSnapshotComposite' })
  declare created: Date;

  @ForeignKey(() => App)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  @Index({ name: 'appSnapshotComposite' })
  declare AppId: number;

  @BelongsTo(() => App)
  declare App?: Awaited<App>;

  /**
   * XXX: Update this to not allow null after the migration has finished
   */
  @ForeignKey(() => User)
  @AllowNull(true)
  @Column(DataType.UUID)
  declare UserId?: string;

  @BelongsTo(() => User)
  declare User?: Awaited<User>;
}
