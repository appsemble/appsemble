import { Theme as ThemeType } from '@appsemble/types';
import { AllowNull, Column, CreatedAt, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'Theme', paranoid: false, updatedAt: false })
export class Theme extends Model implements Omit<ThemeType, 'font' | 'tileLayer'> {
  @AllowNull(false)
  @Column
  bulmaVersion: string;

  @AllowNull(false)
  @Column
  primaryColor: string;

  @AllowNull(false)
  @Column
  linkColor: string;

  @AllowNull(false)
  @Column
  successColor: string;

  @AllowNull(false)
  @Column
  infoColor: string;

  @AllowNull(false)
  @Column
  warningColor: string;

  @AllowNull(false)
  @Column
  dangerColor: string;

  @AllowNull(false)
  @Column
  themeColor: string;

  @AllowNull(false)
  @Column
  splashColor: string;

  @AllowNull(false)
  @Column
  fontFamily: string;

  @AllowNull(false)
  @Column
  fontSource: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  css: string;

  @CreatedAt
  created: Date;
}
