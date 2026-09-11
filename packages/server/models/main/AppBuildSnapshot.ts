import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import { type AppBuildManifest } from '../../utils/appBuildManifest.js';
import { AppSnapshot } from './AppSnapshot.js';

@Table({ tableName: 'AppBuildSnapshot', timestamps: false })
export class AppBuildSnapshot extends Model {
  @AllowNull(false)
  @Column(DataType.JSONB)
  declare buildManifestJson: AppBuildManifest;

  @PrimaryKey
  @ForeignKey(() => AppSnapshot)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare AppSnapshotId: number;

  @BelongsTo(() => AppSnapshot, { onDelete: 'CASCADE' })
  declare AppSnapshot?: Awaited<AppSnapshot>;
}
