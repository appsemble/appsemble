import { type Theme as ThemeType } from '@appsemble/lang-sdk';
import { AllowNull, Column, CreatedAt, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'Theme', paranoid: false, updatedAt: false })
export class Theme extends Model implements Omit<ThemeType, 'font' | 'tileLayer'> {
  @AllowNull(false)
  @Column(DataType.STRING)
  declare bulmaVersion: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare primaryColor: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare linkColor: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare successColor: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare infoColor: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare warningColor: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare dangerColor: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare themeColor: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare splashColor: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare fontFamily: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare fontSource: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare css: string;

  @CreatedAt
  declare created: Date;
}
