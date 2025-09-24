import { type Theme as ThemeType } from '@appsemble/lang-sdk';
import { AllowNull, Column, CreatedAt, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'Theme', paranoid: false, updatedAt: false })
export class Theme extends Model implements Omit<ThemeType, 'font' | 'tileLayer'> {
  @AllowNull(false)
  @Column(DataType.STRING)
  bulmaVersion!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  primaryColor!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  linkColor!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  successColor!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  infoColor!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  warningColor!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  dangerColor!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  themeColor!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  splashColor!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  fontFamily!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  fontSource!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  css!: string;

  @CreatedAt
  created!: Date;
}
