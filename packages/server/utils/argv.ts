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
}

const defaults: Argv = {
  quiet: 0,
  verbose: 0,
  host: undefined,
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
};

export const argv = { ...defaults };

/**
 * Reset argv using the specified options.
 *
 * Unspecified options will be reset to their default values.
 *
 * @param options The argument overrises to set.
 * @returns The argv instance.
 */
export function setArgv(options: Partial<Argv>): Argv {
  return Object.assign(argv, defaults, options);
}
