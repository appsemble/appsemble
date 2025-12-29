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
  declare id: number;

  @AllowNull(false)
  @Column(DataType.JSON)
  declare definition: AppDefinition;

  /**
   * The maximum length of a domain name is 255 bytes as per
   * https://tools.ietf.org/html/rfc1034#section-3.1. The reason the maximum length of the field
   * is 253, is explained on https://devblogs.microsoft.com/oldnewthing/20120412-00/?p=7873.
   */
  @Column({ type: DataType.STRING(253) })
  @Index({ name: 'appDomainComposite' })
  declare domain?: string;

  @Column({ type: DataType.TEXT })
  declare sslCertificate?: string;

  @Column({ type: DataType.TEXT })
  declare sslKey?: string;

  @Column(DataType.BLOB)
  declare icon?: Buffer;

  @Column(DataType.BLOB)
  declare maskableIcon?: Buffer;

  @Column(DataType.STRING)
  declare iconBackground?: string;

  @Index({ name: 'App_path_OrganizationId_key', unique: true })
  @Column(DataType.STRING)
  declare path: string;

  @AllowNull(false)
  @Default('unlisted')
  @Column(DataType.STRING)
  declare visibility: AppVisibility;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare showAppDefinition: boolean;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare template: boolean;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare demoMode: boolean;

  @Column(DataType.TEXT)
  declare coreStyle?: string;

  @Column(DataType.TEXT)
  declare sharedStyle?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare vapidPublicKey: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare vapidPrivateKey: string;

  @Default('unlocked')
  @Column(DataType.ENUM('fullLock', 'studioLock', 'unlocked'))
  declare locked: AppLock;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare enableUnsecuredServiceSecrets: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  declare showAppsembleOAuth2Login: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare showAppsembleLogin: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare displayAppMemberName: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare displayInstallationPrompt: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  declare enableSelfRegistration: boolean;

  @Column(DataType.STRING)
  declare emailName?: string;

  @Column(DataType.STRING)
  declare emailHost?: string;

  @Column(DataType.STRING)
  declare emailUser?: string;

  @Column(DataType.BLOB)
  declare emailPassword?: Buffer;

  @Default(587)
  @Column(DataType.INTEGER)
  declare emailPort: number;

  @Default(true)
  @Column(DataType.BOOLEAN)
  declare emailSecure: boolean;

  @Column(DataType.STRING)
  declare googleAnalyticsID?: string;

  @Column(DataType.STRING)
  declare metaPixelID?: string;

  @Column(DataType.STRING)
  declare msClarityID?: string;

  @Column(DataType.STRING)
  declare sentryDsn?: string;

  @Column(DataType.STRING)
  declare sentryEnvironment?: string;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare scimEnabled: boolean;

  @Column(DataType.BLOB)
  declare scimToken?: Buffer;

  @Column(DataType.TEXT)
  declare controllerCode?: string;

  @Column(DataType.JSON)
  declare controllerImplementations?: ProjectImplementations;

  @AllowNull(true)
  @Column(DataType.JSON)
  declare containers?: CompanionContainerDefinition[];

  @AllowNull(true)
  @Column(DataType.BLOB)
  declare stripeApiSecretKey?: Buffer | null;

  @AllowNull(true)
  @Column(DataType.BLOB)
  declare stripeWebhookSecret?: Buffer | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare successUrl?: string | null;

  @AllowNull(true)
  @Column(DataType.ARRAY(DataType.STRING))
  declare supportedLanguages?: string[];

  @AllowNull(true)
  @Column(DataType.STRING)
  declare cancelUrl?: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare registry?: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare skipGroupInvites: boolean;

  @Column(DataType.STRING)
  declare dbName: string;

  @Column(DataType.STRING)
  declare dbHost: string;

  @Min(1)
  @Max(65_535)
  @Column(DataType.INTEGER)
  declare dbPort: number;

  @Column(DataType.STRING)
  declare dbUser: string;

  @Column(DataType.BLOB)
  declare dbPassword: Buffer;

  @UpdatedAt
  declare updated: Date;

  @CreatedAt
  declare created: Date;

  @DeletedAt
  @Index({ name: 'appDomainComposite' })
  declare deleted?: Date;

  @AllowNull(false)
  @ForeignKey(() => Organization)
  @Index({ name: 'App_path_OrganizationId_key', unique: true })
  @Column(DataType.STRING)
  declare OrganizationId: string;

  @BelongsTo(() => Organization, { onDelete: 'CASCADE' })
  declare Organization?: Awaited<Organization>;

  @HasMany(() => AppMessages)
  declare AppMessages: AppMessages[];

  @HasMany(() => AppRating)
  declare AppRatings: AppRating[];

  @HasMany(() => AppScreenshot)
  declare AppScreenshots: AppScreenshot[];

  @HasMany(() => AppReadme)
  declare AppReadmes: AppReadme[];

  @HasMany(() => AppSnapshot, { onDelete: 'CASCADE' })
  declare AppSnapshots: AppSnapshot[];

  declare RatingAverage?: number;

  declare RatingCount?: number;

  declare hasIcon?: boolean;

  declare hasMaskableIcon?: boolean;

  declare messages?: AppsembleMessages;

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
    const { anchors, ...definition } = this.definition ?? { anchors: [] };

    const result: AppType = {
      id: this.id,
      $created: this.created?.toISOString(),
      $updated: this.updated?.toISOString(),
      emailName: this.emailName,
      domain: this.domain || null,
      googleAnalyticsID: this.googleAnalyticsID,
      metaPixelID: this.metaPixelID,
      msClarityID: this.msClarityID,
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
      supportedLanguages: this.supportedLanguages,
    };

    return omit(result, omittedValues) as AppType;
  }
}
