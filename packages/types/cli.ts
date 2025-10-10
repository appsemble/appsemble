import { type AppVisibility } from './app.js';
import { type AppLock } from './index.js';

/**
 * A `context` which can be specified using the `--context` command line argument.
 */
export interface AppsembleContext {
  /**
   * The remote the app should be under.
   *
   * If `remote` is specified, this will override `--remote` passed on the command line.
   *
   * @default "https://appsemble.app"
   */
  remote?: string;

  /**
   * The organization ID the app should be under.
   *
   * If `organization` is specified, this will override `--organization` passed on the command line.
   */
  organization?: string;

  /**
   * The path to the app icon to use.
   *
   * If `icon` is specified, this will override `--icon` passed on the command line.
   *
   * @default "icon.png"
   */
  icon?: string;

  /**
   * The background color to use for maskable icons.
   *
   * If `iconBackground` is specified, this will override `--icon-background` passed on the command
   * line.
   */
  iconBackground?: string;

  /**
   * The path to the maskable app icon to use.
   *
   * If `maskableIcon` is specified, this will override `--maskable-icon` passed on the command
   * line.
   *
   * @default "maskable-icon.png"
   */
  maskableIcon?: string;

  /**
   * The id of the app to update.
   *
   * If `id` is specified, this will override `--id` passed on the command line.
   */
  id?: number;

  /**
   * The Google Analytics ID that should be used for the app.
   *
   * If `googleAnalyticsId` is specified, this will override `--google-analytics-id` passed on the
   * command line.
   */
  googleAnalyticsId?: string;

  /**
   * The Meta Pixel ID that should be used for the app.
   *
   * If `metaPixelId` is specified, this will override `--meta-pixel-id` passed on the
   * command line.
   */
  metaPixelId?: string;

  /**
   * The custom Sentry DSN for the app.
   *
   * If `sentryDsn` is specified, this will override `--sentry-dsn` passed on the command line.
   */
  sentryDsn?: string;

  /**
   * The custom Sentry environment to use for the app.
   *
   * If `sentryEnvironment` is specified, this will override `--sentry-environment` passed on the
   * command line.
   */
  sentryEnvironment?: string;

  /**
   * Whether the app-definition should be shown.
   *
   * If `showAppDefinition` is specified, this will override `--show-app-definition` passed on the
   * command line.
   */
  showAppDefinition?: boolean;

  /**
   * The alternative app variant to use instead.
   *
   * If `variant` is specified, this will override `--variant` passed on the command line.
   */
  variant?: string;

  /**
   * Determine the app visibility of the app in the Appsemble app store.
   *
   * This doesn’t affect whether or not the app can be accessed on its own domain.
   *
   * - **public**: The app is publicly listed in the Appsemble app store.
   * - **unlisted**: The app store page can be accessed, but the app isn’t listed publicly in the
   * Appsemble app store.
   * - **private**: The app is only visible to people who are part of the organization.
   *
   * If `visibility` is specified, this will override `--visibility` passed on the command line.
   */
  visibility?: AppVisibility;

  /**
   * Whether the app should be a template app.
   *
   * If `template` is specified, this will override `--template` passed on the command line.
   */
  template?: boolean;

  /**
   * Whether the app should be in demoMode.
   *
   * If `demoMode` is specified, this will override `--demo-mode` passed on the command line.
   */
  demoMode?: boolean;

  /**
   * Set the value of AppLock for your app.
   *
   * If `appLock` is specified, this will override `--app-lock` passed on the command line.
   */
  appLock?: AppLock;

  /**
   * A list of collections the app should be added to.
   *
   * If `collections` is specified, this will override `--collections` passed on the command line.
   */
  collections?: number[];

  /**
   * Whether to publish resources from the resources directory.
   *
   * If resources is specified, this will override --resources passed on the command line.
   */
  resources?: boolean;

  /**
   * Whether to publish seed members from `members/index.json` after publishing the app.
   *
   * If members is specified, this will override --members passed on the command line.
   */
  members?: boolean;

  /**
   * Whether to publish assets from the assets directory.
   *
   * If assets is specified, this will override --assets passed on the command line.
   */
  assets?: boolean;

  /**
   * Whether app assets should be clonable.
   *
   * If `assetsClonable` is specified, this will override `--assets-clonable` passed on the command
   * line.
   */
  assetsClonable?: boolean;

  /**
   * The name of the external app database.
   */
  dbName?: string;

  /**
   * The host of the external app database.
   */
  dbHost?: string;

  /**
   * The port of the external app database.
   */
  dbPort?: string;

  /**
   * The user of the external app database.
   */
  dbUser?: string;
}

export interface AppsembleRC {
  /**
   * The background color to use for maskable icons.
   *
   * If `iconBackground` is specified, this will override `--icon-background` passed on the command
   * line.
   */
  iconBackground?: string;

  context?: Record<string, AppsembleContext>;
}
