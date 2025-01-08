export interface Argv {
  // //////////////////////////////////////////////////////////////////////////////////////////// //
  // Logging                                                                                      //
  // //////////////////////////////////////////////////////////////////////////////////////////// //
  /**
   * Amount by which the logging verbosity is decreased from its default.
   */
  quiet: number;

  /**
   * Amount by which the logging verbosity is increased from its default.
   */
  verbose: number;

  // //////////////////////////////////////////////////////////////////////////////////////////// //
  // Hosting                                                                                      //
  // //////////////////////////////////////////////////////////////////////////////////////////// //
  /**
   * The hostname on which Appsemble Studio is served.
   */
  host: string;

  /**
   * Whether or not to force the protocol to HTTPS.
   *
   * @default false
   */
  forceProtocolHttps: boolean;

  /**
   * The port on which Appsemble should be started.
   *
   * @default 9999
   */
  port: number;

  /**
   * This should be true of the HTTP proxy protocol is used.
   *
   * @default false
   */
  proxy: boolean;

  /**
   * The app secret. This is used for various things.
   */
  secret: string;

  /**
   * The key used for all the data that is encrypted using AES.
   */
  aesSecret: string;

  // //////////////////////////////////////////////////////////////////////////////////////////// //
  // DNS                                                                                          //
  // //////////////////////////////////////////////////////////////////////////////////////////// //
  /**
   * The strategy used to configure DNS.
   */
  appDomainStrategy: string;

  /**
   * The name of the Kubernetes server that’s serving Appsemble.
   */
  serviceName: string;

  /**
   * The exposed port of the Kubernetes server that’s serving Appsemble.
   */
  servicePort: string;

  /**
   * The hostname on which the Kubernetes API is available.
   *
   * @default 'kubernetes.default.svc'
   */
  kubernetesServiceHost: string;

  /**
   * The port on which the Kubernetes API is available.
   *
   * @default 443
   */
  kubernetesServicePort: number | string;

  /**
   * Kubernetes annotations to apply to the ingress as a JSON string.
   */
  ingressAnnotations: string;

  /**
   * The class name of the ingress.
   *
   * @default 'nginx'
   */
  ingressClassName: string;

  /**
   * The name of the cert-manager issuer to use for apps.
   */
  issuer?: string;

  /**
   * The name of the cert-manager cluster issuer to use for apps.
   */
  clusterIssuer?: string;

  // //////////////////////////////////////////////////////////////////////////////////////////// //
  // Database                                                                                     //
  // //////////////////////////////////////////////////////////////////////////////////////////// //
  /**
   * The hostname of the database.
   */
  databaseHost: string;

  /**
   * The port on which the database is accessed.
   */
  databasePort: number;

  /**
   * The username used to access the database.
   */
  databaseUser: string;

  /**
   * The password used to access the database.
   */
  databasePassword: string;

  /**
   * The name of the database to use.
   */
  databaseName: string;

  /**
   * Whether or not to use SSL for the database connection.
   *
   * @default false
   */
  databaseSsl: boolean;

  /**
   * The URL for the database. This replaces all other database options.
   */
  databaseUrl: string;

  /**
   * The version to migrate to.
   */
  migrateTo: string;

  // //////////////////////////////////////////////////////////////////////////////////////////// //
  // SSL                                                                                          //
  // //////////////////////////////////////////////////////////////////////////////////////////// //
  /**
   * Whether or not to use SSL
   *
   * @default false
   */
  ssl: boolean;

  /**
   * Either the SSL key as a string or as a path to the file to use.
   */
  sslKey: string;

  /**
   * Either the SSL certificate as a string or as a path to the file to use.
   */
  sslCert: string;

  // //////////////////////////////////////////////////////////////////////////////////////////// //
  // SMTP                                                                                         //
  // //////////////////////////////////////////////////////////////////////////////////////////// //
  /**
   * The SMTP sender to use.
   */
  smtpFrom: string;

  /**
   * The SMTP server host to use.
   */
  smtpHost: string;

  /**
   * The SMTP server port to use.
   */
  smtpPort: number;

  /**
   * The username to use for authenticating to the SMTP server.
   */
  smtpUser: string;

  /**
   * The password to use for authenticating to the SMTP server.
   */
  smtpPass: string;

  /**
   * Whether or not to use the secure SMTP protocol.
   *
   * @default false
   */
  smtpSecure: boolean;

  // //////////////////////////////////////////////////////////////////////////////////////////// //
  // IMAP
  // //////////////////////////////////////////////////////////////////////////////////////////// //

  /**
   * The IMAP server host to use.
   */
  imapHost: string;

  /**
   * The IMAP server port to use.
   */
  imapPort: number;

  /**
   * The username to use for authenticating to the IMAP server.
   */
  imapUser: string;

  /**
   * The password to use for authenticating to the IMAP server.
   */
  imapPass: string;

  /**
   * Whether or not to use the secure IMAP protocol.
   *
   * @default false
   */
  imapSecure: boolean;

  /**
   * Whether or not to copy sent messages to the sent folder.
   * Experimental
   *
   * @default false
   */
  imapCopyToSentFolder: boolean;

  // //////////////////////////////////////////////////////////////////////////////////////////// //
  // App email quotas                                                                             //
  // //////////////////////////////////////////////////////////////////////////////////////////// //

  /**
   * Whether or not to set a quota on the number of emails that can be sent per app per day.
   *
   * @default false
   */
  enableAppEmailQuota: boolean;

  /**
   * A maximum number of emails that can be sent per app per day.
   *
   * Not applied to system emails/emails from apps with custom mail settings.
   *
   * @default 10
   */

  dailyAppEmailQuota: number;

  /**
   * Whether or not to send an email to the app owner when the app email quota is reached.
   *
   * @default false
   */
  enableAppEmailQuotaAlerts: boolean;

  // //////////////////////////////////////////////////////////////////////////////////////////// //
  // Sentry                                                                                       //
  // //////////////////////////////////////////////////////////////////////////////////////////// //
  /**
   * The DSN to use for sending crash reports to Sentry.
   */
  sentryDsn: string;

  /**
   * The Sentry environment to use for crash reports.
   */
  sentryEnvironment: string;

  /**
   * Domain wildcards for apps where Sentry integration should be injected if Sentry is configured
   */
  sentryAllowedDomains?: string;

  // //////////////////////////////////////////////////////////////////////////////////////////// //
  // OAuth2                                                                                       //
  // //////////////////////////////////////////////////////////////////////////////////////////// //

  /**
   * The client ID for authenticating users using GitHub.
   */
  githubClientId: string;

  /**
   * The client secret for authenticating users using GitHub.
   */
  githubClientSecret: string;

  /**
   * The client ID for authenticating users using GitLab.
   */
  gitlabClientId: string;

  /**
   * The client secret for authenticating users using GitLab.
   */
  gitlabClientSecret: string;

  /**
   * The client ID for authenticating users using Google.
   */
  googleClientId: string;

  /**
   * The client secret for authenticating users using Google.
   */
  googleClientSecret: string;

  // //////////////////////////////////////////////////////////////////////////////////////////// //
  // Miscellaneous                                                                                //
  // //////////////////////////////////////////////////////////////////////////////////////////// //
  /**
   * Whether or not user registration should be disabled on the server.
   *
   * @default false
   */
  disableRegistration: boolean;

  /**
   * The remote to use synchronizing blocks.
   *
   * @example 'https://appsemble.app'
   */
  remote: string;

  /**
   * How many minutes are between each cron job run.
   *
   * @default 5
   */
  interval: number;

  /**
   * Used to authenticate the admin users e.g., for newsletter-related endpoints.
   *
   * If not set, related operations will return 401.
   *
   * @default undefined
   */
  adminApiSecret: string;

  /**
   * The number of replicas to scale a deployment to.
   *
   * @default 0
   */
  scaleTo: number;

  /**
   * The host of the Amazon S3 compatible object storage server
   *
   * default undefined
   */
  s3Host: string;

  /**
   * The host of the Amazon S3 compatible object storage server
   *
   * default 9000
   */
  s3Port: number;

  /**
   * Whether ssl should be used for the Amazon S3 compatible object storage server
   *
   * default true
   */
  s3Ssl: boolean;

  /**
   * The access key of the Amazon S3 compatible object storage server
   *
   * default undefined
   */
  s3AccessKey: string;

  /**
   * The secret key of the Amazon S3 compatible object storage server
   *
   * default undefined
   */
  s3SecretKey: string;
}

const defaults: Argv = {
  quiet: 0,
  verbose: 0,
  host: undefined,
  forceProtocolHttps: false,
  port: 9999,
  proxy: false,
  secret: undefined,
  aesSecret: undefined,
  appDomainStrategy: undefined,
  serviceName: undefined,
  servicePort: undefined,
  kubernetesServiceHost: 'kubernetes.default.svc',
  kubernetesServicePort: 443,
  ingressAnnotations: undefined,
  ingressClassName: 'nginx',
  databaseHost: undefined,
  databasePort: 5432,
  databaseUser: undefined,
  databasePassword: undefined,
  databaseName: undefined,
  databaseSsl: false,
  databaseUrl: undefined,
  interval: 5,
  migrateTo: undefined,
  ssl: false,
  sslKey: undefined,
  sslCert: undefined,
  smtpFrom: undefined,
  smtpHost: undefined,
  smtpPort: undefined,
  smtpUser: undefined,
  smtpPass: undefined,
  smtpSecure: false,
  imapHost: undefined,
  imapPort: undefined,
  imapSecure: false,
  imapUser: undefined,
  imapPass: undefined,
  imapCopyToSentFolder: false,
  enableAppEmailQuota: false,
  dailyAppEmailQuota: 10,
  enableAppEmailQuotaAlerts: false,
  sentryDsn: undefined,
  sentryEnvironment: undefined,
  githubClientId: undefined,
  githubClientSecret: undefined,
  gitlabClientId: undefined,
  gitlabClientSecret: undefined,
  googleClientId: undefined,
  googleClientSecret: undefined,
  disableRegistration: false,
  remote: null,
  adminApiSecret: undefined,
  scaleTo: 0,
  s3Host: undefined,
  s3Port: 9000,
  s3Ssl: true,
  s3AccessKey: undefined,
  s3SecretKey: undefined,
};

export const argv = { ...defaults };

/**
 * Reset argv using the specified options.
 *
 * Unspecified options will be reset to their default values.
 *
 * @param options The argument overrides to set.
 * @returns The argv instance.
 */
export function setArgv(options: Partial<Argv>): Argv {
  return Object.assign(argv, defaults, options);
}

/**
 * Update `only` provided argv properties.
 *
 * As opposed to `setArgv`, unspecified options will keep their current values.
 *
 * @param options The argument overrides to set.
 * @returns The argv instance.
 */
export function updateArgv(options: Partial<Argv>): Argv {
  return Object.assign(argv, options);
}
