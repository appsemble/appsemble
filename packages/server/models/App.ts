import {
  type AppDefinition,
  type AppsembleMessages,
  type App as AppType,
  type AppVisibility,
  type ProjectImplementations,
} from '@appsemble/types';
import { omit } from 'lodash-es';
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
import { stringify } from 'yaml';

import {
  AppBlockStyle,
  AppMember,
  AppMessages,
  AppOAuth2Secret,
  AppRating,
  AppSamlSecret,
  AppScreenshot,
  AppServiceSecret,
  AppSnapshot,
  AppSubscription,
  Asset,
  Organization,
  Resource,
  Team,
} from './index.js';
import { resolveIconUrl } from '../utils/model.js';

@Table({ tableName: 'App', paranoid: true })
export class App extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
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

  @Column({ type: DataType.TEXT })
  sslCertificate: string;

  @Column({ type: DataType.TEXT })
  sslKey: string;

  @Column(DataType.BLOB)
  icon?: Buffer;

  @Column(DataType.BLOB)
  maskableIcon?: Buffer;

  @Column(DataType.STRING)
  iconBackground: string;

  @Unique('UniquePathIndex')
  @Column(DataType.STRING)
  path: string;

  @AllowNull(false)
  @Default('unlisted')
  @Column(DataType.STRING)
  visibility: AppVisibility;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  showAppDefinition: boolean;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  template: boolean;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  demoMode: boolean;

  @Column(DataType.TEXT)
  longDescription: string;

  @Column(DataType.TEXT)
  coreStyle: string;

  @Column(DataType.TEXT)
  sharedStyle: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  vapidPublicKey: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  vapidPrivateKey: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  locked: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  showAppsembleOAuth2Login: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  showAppsembleLogin: boolean;

  @Column(DataType.STRING)
  emailName: string;

  @Column(DataType.STRING)
  emailHost: string;

  @Column(DataType.STRING)
  emailUser: string;

  @Column(DataType.BLOB)
  emailPassword: Buffer;

  @Default(587)
  @Column(DataType.INTEGER)
  emailPort: number;

  @Default(true)
  @Column(DataType.BOOLEAN)
  emailSecure: boolean;

  @Column(DataType.STRING)
  googleAnalyticsID: string;

  @Column(DataType.STRING)
  sentryDsn: string;

  @Column(DataType.STRING)
  sentryEnvironment: string;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  scimEnabled: boolean;

  @Column(DataType.BLOB)
  scimToken: Buffer;

  @Column(DataType.TEXT)
  controllerCode: string;

  @Column(DataType.JSON)
  controllerImplementations: ProjectImplementations;

  @UpdatedAt
  updated: Date;

  @CreatedAt
  created: Date;

  @DeletedAt
  deleted: Date;

  @AllowNull(false)
  @ForeignKey(() => Organization)
  @Unique('UniquePathIndex')
  @Column(DataType.STRING)
  OrganizationId: string;

  @HasMany(() => AppBlockStyle)
  AppBlockStyles: AppBlockStyle[];

  @HasMany(() => AppOAuth2Secret)
  AppOAuth2Secrets: AppOAuth2Secret[];

  @HasMany(() => AppSamlSecret)
  AppSamlSecrets: AppSamlSecret[];

  @BelongsTo(() => Organization)
  Organization: Awaited<Organization>;

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

  @HasMany(() => AppServiceSecret)
  AppServiceSecrets: AppServiceSecret[];

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
   * @param omittedValues A list of fields to omit from the result.
   * @returns An app resource that can be safely returned from the API.
   */
  toJSON(omittedValues: (keyof AppType)[] = []): AppType {
    const { anchors, ...definition } = this.definition;

    const result: AppType = {
      id: this.id,
      $created: this.created?.toISOString(),
      $updated: this.updated?.toISOString(),
      emailName: this.emailName,
      domain: this.domain || null,
      googleAnalyticsID: this.googleAnalyticsID,
      path: this.path,
      visibility: this.visibility,
      locked: Boolean(this.locked),
      hasIcon: this.get('hasIcon') ?? Boolean(this.icon),
      hasMaskableIcon: this.get('hasMaskableIcon') ?? Boolean(this.maskableIcon),
      iconBackground: this.iconBackground || '#ffffff',
      iconUrl: resolveIconUrl(this),
      longDescription: this.longDescription,
      coreStyle: this.coreStyle == null ? undefined : this.coreStyle,
      sharedStyle: this.sharedStyle == null ? undefined : this.sharedStyle,
      definition,
      yaml: omittedValues.includes('yaml')
        ? undefined
        : this.AppSnapshots?.[0]?.yaml || stringify(this.definition),
      showAppDefinition: this.showAppDefinition,
      sentryDsn: this.sentryDsn,
      sentryEnvironment: this.sentryEnvironment,
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
      demoMode: this.demoMode,
      controllerCode: this.controllerCode,
      controllerImplementations: this.controllerImplementations,
    };

    return omit(result, omittedValues) as AppType;
  }
}
