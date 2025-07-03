import { type ResourceVersion as ResourceVersionType } from '@appsemble/types';
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import { AppMember, Resource } from './index.js';

@Table({ tableName: 'ResourceVersion', updatedAt: false })
export class ResourceVersion extends Model {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column(DataType.JSON)
  data?: any;

  @ForeignKey(() => Resource)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  ResourceId!: number;

  @BelongsTo(() => Resource)
  Resource?: Awaited<Resource>;

  @ForeignKey(() => AppMember)
  @Column(DataType.UUID)
  AppMemberId?: string;

  @BelongsTo(() => AppMember, { onDelete: 'CASCADE' })
  AppMember?: Awaited<AppMember>;

  @CreatedAt
  created!: Date;

  toJSON(): ResourceVersionType {
    return {
      created: this.created.toISOString(),
      data: this.data,
      author: this.AppMember
        ? { id: this.AppMember.id, name: this.AppMember.name, email: this.AppMember.email }
        : undefined,
    };
  }
}
