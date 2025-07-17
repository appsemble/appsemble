import { type AppDefinition, type CompanionContainerDefinition } from '@appsemble/lang-sdk';
import { AppsembleError, logger } from '@appsemble/node-utils';
import {
  type AppLock,
  type AppsembleMessages,
  type App as AppType,
  type AppVisibility,
  type ProjectImplementations,
} from '@appsemble/types';
import { omit } from 'lodash-es';
import {
  AllowNull,
  AutoIncrement,
  BeforeCreate,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  ForeignKey,
  HasMany,
  Index,
  Max,
  Min,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { stringify } from 'yaml';

import { resolveIconUrl } from '../../utils/app.js';
import { argv } from '../../utils/argv.js';
import { encrypt } from '../../utils/crypto.js';
import {
  AppMessages,
  AppRating,
  AppReadme,
  AppScreenshot,
  AppSnapshot,
  Organization,
} from '../index.js';

@Table({ tableName: 'App', paranoid: true })
export class App extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.JSON)
  definition!: AppDefinition;

  /**
   * The maximum length of a domain name is 255 bytes as per
   * https://tools.ietf.org/html/rfc1034#section-3.1. The reason the maximum length of the field
   * is 253, is explained on https://devblogs.microsoft.com/oldnewthing/20120412-00/?p=7873.
   */
  @Column({ type: DataType.STRING(253) })
  @Index({ name: 'appDomainComposite' })
  domain?: string;

  @Column({ type: DataType.TEXT })
  sslCertificate?: string;

  @Column({ type: DataType.TEXT })
  sslKey?: string;

  @Column(DataType.BLOB)
  icon?: Buffer;

  @Column(DataType.BLOB)
  maskableIcon?: Buffer;

  @Column(DataType.STRING)
  iconBackground?: string;

  @Index({ name: 'App_path_OrganizationId_key', unique: true })
  @Column(DataType.STRING)
  path!: string;

  @AllowNull(false)
  @Default('unlisted')
  @Column(DataType.STRING)
  visibility!: AppVisibility;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  showAppDefinition!: boolean;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  template!: boolean;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  demoMode!: boolean;

  @Column(DataType.TEXT)
  coreStyle?: string;

  @Column(DataType.TEXT)
  sharedStyle?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  vapidPublicKey!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  vapidPrivateKey!: string;

  @Default('unlocked')
  @Column(DataType.ENUM('fullLock', 'studioLock', 'unlocked'))
  locked!: AppLock;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  enableUnsecuredServiceSecrets!: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  showAppsembleOAuth2Login!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  showAppsembleLogin!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  displayAppMemberName!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  displayInstallationPrompt!: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  enableSelfRegistration!: boolean;

  @Column(DataType.STRING)
  emailName?: string;

  @Column(DataType.STRING)
  emailHost?: string;

  @Column(DataType.STRING)
  emailUser?: string;

  @Column(DataType.BLOB)
  emailPassword?: Buffer;

  @Default(587)
  @Column(DataType.INTEGER)
  emailPort!: number;

  @Default(true)
  @Column(DataType.BOOLEAN)
  emailSecure!: boolean;

  @Column(DataType.STRING)
  googleAnalyticsID?: string;

  @Column(DataType.STRING)
  sentryDsn?: string;

  @Column(DataType.STRING)
  sentryEnvironment?: string;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  scimEnabled!: boolean;

  @Column(DataType.BLOB)
  scimToken?: Buffer;

  @Column(DataType.TEXT)
  controllerCode?: string;

  @Column(DataType.JSON)
  controllerImplementations?: ProjectImplementations;

  @AllowNull(true)
  @Column(DataType.JSON)
  containers?: CompanionContainerDefinition[];

  @AllowNull(true)
  @Column(DataType.STRING)
  registry?: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  skipGroupInvites!: boolean;

  @Column(DataType.STRING)
  dbName!: string;

  @Column(DataType.STRING)
  dbHost!: string;

  @Min(1)
  @Max(65_535)
  @Column(DataType.INTEGER)
  dbPort!: number;

  @Column(DataType.STRING)
  dbUser!: string;

  @Column(DataType.BLOB)
  dbPassword!: Buffer;

  @UpdatedAt
  updated!: Date;

  @CreatedAt
  created!: Date;

  @DeletedAt
  @Index({ name: 'appDomainComposite' })
  deleted?: Date;

  @AllowNull(false)
  @ForeignKey(() => Organization)
  @Index({ name: 'App_path_OrganizationId_key', unique: true })
  @Column(DataType.STRING)
  OrganizationId!: string;

  @BelongsTo(() => Organization, { onDelete: 'CASCADE' })
  Organization?: Awaited<Organization>;

  @HasMany(() => AppMessages)
  AppMessages!: AppMessages[];

  @HasMany(() => AppRating)
  AppRatings!: AppRating[];

  @HasMany(() => AppScreenshot)
  AppScreenshots!: AppScreenshot[];

  @HasMany(() => AppReadme)
  AppReadmes!: AppReadme[];

  @HasMany(() => AppSnapshot, { onDelete: 'CASCADE' })
  AppSnapshots!: AppSnapshot[];

  RatingAverage?: number;

  RatingCount?: number;

  hasIcon?: boolean;

  hasMaskableIcon?: boolean;

  messages?: AppsembleMessages;

  @BeforeCreate
  static beforeCreateHook(instance: App): void {
    if (!instance.dbHost) {
      let dbHost;
      if (argv.databaseHost) {
        logger.info('Using database host argv');
        dbHost = argv.databaseHost;
      } else if (process.env.DATABASE_HOST) {
        logger.warn('Missing database host argv, using process.env');
        dbHost = process.env.DATABASE_HOST;
      } else {
        logger.warn('Missing database host env variable, using default');
        dbHost = 'localhost';
      }
      // eslint-disable-next-line no-param-reassign
      instance.dbHost = dbHost;
    }

    if (!instance.dbPort) {
      let dbPort;
      if (argv.databasePort) {
        logger.info('Using database port argv');
        dbPort = argv.databasePort;
      } else if (process.env.DATABASE_PORT) {
        logger.warn('Missing database port argv, using process.env');
        dbPort = Number(process.env.DATABASE_PORT);
      } else {
        logger.warn('Missing database port env variable, using default');
        dbPort = 54_321;
      }
      // eslint-disable-next-line no-param-reassign
      instance.dbPort = dbPort;
    }

    if (!instance.dbUser) {
      let dbUser;
      if (argv.databaseUser) {
        logger.info('Using database user argv');
        dbUser = argv.databaseUser;
      } else if (process.env.DATABASE_USER) {
        logger.warn('Missing database user argv, using process.env');
        dbUser = process.env.DATABASE_USER;
      } else {
        logger.warn('Missing database user env variable, using default');
        dbUser = 'admin';
      }
      // eslint-disable-next-line no-param-reassign
      instance.dbUser = dbUser;
    }

    if (!instance.dbPassword) {
      if (!argv.databasePassword && process.env.NODE_ENV === 'production') {
        throw new AppsembleError(
          'Missing database password env variable. This is insecure and should be allowed only in development!',
        );
      }

      if (!argv.aesSecret && process.env.NODE_ENV === 'production') {
        throw new AppsembleError(
          'Missing aes secret env variable. This is insecure and should be allowed only in development!',
        );
      }

      let dbPassword;
      if (argv.databasePassword) {
        logger.info('Using database password argv');
        dbPassword = argv.databasePassword;
      } else if (process.env.DATABASE_PASSWORD) {
        logger.warn('Missing database password argv, using process.env');
        dbPassword = process.env.DATABASE_PASSWORD;
      } else {
        logger.warn('Missing database password env variable, using default');
        dbPassword = 'password';
      }

      // eslint-disable-next-line no-param-reassign
      instance.dbPassword = encrypt(
        dbPassword,
        argv.aesSecret || 'Local Appsemble development AES secret',
      );
    }
  }

  /**
   * Normalizes an app record for consistent return values.
   *
   * @param omittedValues A list of fields to omit from the result.
   * @returns An app resource that can be safely returned from the API.
   */
  toJSON(omittedValues: (keyof AppType)[] = []): AppType {
    const { anchors, ...definition } = this.definition ?? {};

    const result: AppType = {
      id: this.id,
      $created: this.created?.toISOString(),
      $updated: this.updated?.toISOString(),
      emailName: this.emailName,
      domain: this.domain || null,
      googleAnalyticsID: this.googleAnalyticsID,
      path: this.path,
      visibility: this.visibility,
      template: this.template,
      locked: this.locked || 'unlocked',
      hasIcon: this.get('hasIcon') ?? Boolean(this.icon),
      hasMaskableIcon: this.get('hasMaskableIcon') ?? Boolean(this.maskableIcon),
      iconBackground: this.iconBackground || '#ffffff',
      iconUrl: resolveIconUrl(this),
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
      enableSelfRegistration: this.enableSelfRegistration ?? true,
      enableUnsecuredServiceSecrets: this.enableUnsecuredServiceSecrets ?? false,
      displayAppMemberName: this.displayAppMemberName ?? false,
      displayInstallationPrompt: this.displayInstallationPrompt ?? false,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks) - Severe
      rating:
        this.RatingAverage == null
          ? undefined
          : { count: this.RatingCount, average: this.RatingAverage },
      OrganizationId: this.OrganizationId,
      OrganizationName: this?.Organization?.name,
      screenshotUrls: this.AppScreenshots?.sort((a, b) => {
        const { index: aIndex } = a;
        const { index: bIndex } = b;
        if (aIndex > bIndex) {
          return 1;
        }
        if (aIndex < bIndex) {
          return -1;
        }
        return 0;
      }).map(({ id }) => `/api/apps/${this.id}/screenshots/${id}`),
      readmeUrl: this.AppReadmes?.length
        ? `/api/apps/${this.id}/readmes/${this.AppReadmes?.[0]?.id}`
        : undefined,
      messages: this.messages,
      demoMode: this.demoMode,
      controllerCode: this.controllerCode,
      controllerImplementations: this.controllerImplementations,
      skipGroupInvites: this.skipGroupInvites,
      version: (this.AppSnapshots || [{ id: -1 }]).at(-1)?.id,
    };

    return omit(result, omittedValues) as AppType;
  }
}
