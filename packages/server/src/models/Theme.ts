import { Theme as ThemeType } from '@appsemble/types';
import { AllowNull, Column, CreatedAt, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'Theme', paranoid: false, updatedAt: false })
export class Theme extends Model implements Omit<ThemeType, 'font' | 'tileLayer'> {
  @Column
  bulmaVersion: string;

  @Column
  primaryColor: string;

  @Column
  linkColor: string;

  @Column
  successColor: string;

  @Column
  infoColor: string;

  @Column
  warningColor: string;

  @Column
  dangerColor: string;

  @Column
  themeColor: string;

  @Column
  splashColor: string;

  @Column
  fontFamily: string;

  @Column
  fontSource: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  css: string;

  @CreatedAt
  created: Date;
}
