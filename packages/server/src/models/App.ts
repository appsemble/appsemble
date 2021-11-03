// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { AppDefinition, AppsembleMessages, App as AppType } from '@appsemble/types';
import yaml from 'js-yaml';
import { omit } from 'lodash';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';

import {
  AppBlockStyle,
  AppMember,
  AppMessages,
  AppOAuth2Secret,
  AppRating,
  AppSamlSecret,
  AppScreenshot,
  AppSnapshot,
  AppSubscription,
  Asset,
  Organization,
  Resource,
  Team,
} from '.';
import { resolveIconUrl } from '../utils/model';

@Table({ tableName: 'App', paranoid: true })
export class App extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column(DataType.JSON)
  definition: AppDefinition;

  /**
   * The maximum length of a domain name is 255 bytes as per
   * https://tools.ietf.org/html/rfc1034#section-3.1. The reason the maximum length of the field
   * is 253, is explained on https://devblogs.microsoft.com/oldnewthing/20120412-00/?p=7873.
   */
  @Column({ type: DataType.STRING(253) })
  domain: string;

  @Column
  icon?: Buffer;

  @Column
  maskableIcon?: Buffer;

  @Column
  iconBackground: string;

  @Unique('UniquePathIndex')
  @Column
  path: string;

  @AllowNull(false)
  @Default(false)
  @Column
  private: boolean;

  @AllowNull(false)
  @Default(false)
  @Column
  template: boolean;

  @Column(DataType.TEXT)
  longDescription: string;

  @Column(DataType.TEXT)
  coreStyle: string;

  @Column(DataType.TEXT)
  sharedStyle: string;

  @AllowNull(false)
  @Column
  vapidPublicKey: string;

  @AllowNull(false)
  @Column
  vapidPrivateKey: string;

  @Default(false)
  @Column
  locked: boolean;

  @Default(true)
  @Column
  showAppsembleOAuth2Login: boolean;

  @Default(false)
  @Column
  showAppsembleLogin: boolean;

  @Column
  googleAnalyticsID: string;

  @UpdatedAt
  updated: Date;

  @CreatedAt
  created: Date;

  @DeletedAt
  deleted: Date;

  @AllowNull(false)
  @ForeignKey(() => Organization)
  @Unique('UniquePathIndex')
  @Column
  OrganizationId: string;

  @HasMany(() => AppBlockStyle)
  AppBlockStyles: AppBlockStyle[];

  @HasMany(() => AppOAuth2Secret)
  AppOAuth2Secrets: AppOAuth2Secret[];

  @HasMany(() => AppSamlSecret)
  AppSamlSecrets: AppSamlSecret[];

  @BelongsTo(() => Organization)
  Organization: Organization;

  @HasMany(() => AppSubscription)
  AppSubscriptions: AppSubscription[];

  @HasMany(() => AppMessages)
  AppMessages: AppMessages[];

  @HasMany(() => Asset)
  Assets: Asset[];

  @HasMany(() => AppMember)
  AppMembers: AppMember[];

  @HasMany(() => Resource)
  Resources: Resource[];

  @HasMany(() => AppRating)
  AppRatings: AppRating[];

  @HasMany(() => AppScreenshot)
  AppScreenshots: AppScreenshot[];

  @HasMany(() => Team)
  Teams: Team[];

  @HasMany(() => AppSnapshot, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  AppSnapshots: AppSnapshot[];

  RatingAverage?: number;
  RatingCount?: number;
  hasIcon?: boolean;
  hasMaskableIcon?: boolean;
  messages?: AppsembleMessages;

  /**
   * Normalizes an app record for consistent return values.
   *
   * @param omittedValues - A list of fields to omit from the result.
   * @returns An app resource that can be safely returned from the API.
   */
  toJSON(omittedValues: (keyof AppType)[] = []): AppType {
    const { anchors, ...definition } = this.definition;

    const result: AppType = {
      id: this.id,
      $created: this.created.toISOString(),
      $updated: this.updated.toISOString(),
      domain: this.domain || null,
      path: this.path,
      private: Boolean(this.private),
      locked: Boolean(this.locked),
      hasIcon: this.get('hasIcon') ?? Boolean(this.icon),
      hasMaskableIcon: this.get('hasMaskableIcon') ?? Boolean(this.maskableIcon),
      iconBackground: this.iconBackground || '#ffffff',
      iconUrl: resolveIconUrl(this),
      longDescription: this.longDescription,
      definition,
      yaml:
        this.AppSnapshots?.[0]?.yaml ??
        (!omittedValues.includes('yaml') && yaml.dump(this.definition)),
      showAppsembleLogin: this.showAppsembleLogin ?? false,
      showAppsembleOAuth2Login: this.showAppsembleOAuth2Login ?? true,
      rating:
        this.RatingAverage == null
          ? undefined
          : { count: this.RatingCount, average: this.RatingAverage },
      resources: this.template && this.Resources?.length ? true : undefined,
      OrganizationId: this.OrganizationId,
      OrganizationName: this?.Organization?.name,
      screenshotUrls: this.AppScreenshots?.map(
        ({ id }) => `/api/apps/${this.id}/screenshots/${id}`,
      ),
      messages: this.messages,
    };

    return omit(result, omittedValues) as AppType;
  }
}
