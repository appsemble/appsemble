import { PackageJson } from 'read-pkg-up';
import { JsonObject } from 'type-fest';

/**
 * The base arguments from the command line.
 *
 * See {@link ./index.js}.
 */
export interface BaseArguments {
  verbose?: number;
  quiet?: number;
  remote: string;
  clientCredentials?: string;
}

/**
 * The arguments passed to `appsemble app update`.
 *
 * See {@link ./commands/app/update.js}.
 */
export interface UpdateAppArguments extends BaseArguments {
  /**
   * The ID of the app to update.
   */
  appId: number;

  /**
   * The path in which the app YAML is located.
   */
  path: string;

  /**
   * Whether the app should be marked as private.
   */
  private: boolean;

  /**
   * Whether the app should be marked as a template.
   */
  template: boolean;

  /**
   * Whether the locked property should be ignored.
   */
  force: boolean;
}

export interface MonoRepoPackageJson extends PackageJson {
  appsembleServer?: JsonObject;
}

export interface AppsembleContext {
  /**
   * If `remote` is specified, this will override `--remote` passed by the command line.
   */
  remote?: string;

  /**
   * If `organization` is specified, this will override `--organization` passed by the command line
   * when creating apps.
   */
  organization?: string;

  /**
   * If `id` is specified, this will override `--organization-id` passed by the command line when
   * updating an app.
   */
  id?: string;

  /**
   * If `private` is specified, this will override `--private` passed on the command line.
   */
  private?: boolean;

  /**
   * If `template` is specified, this will override `--template` passed on the command line.
   */
  template?: boolean;
}

export interface AppsembleRC {
  /**
   * The background color to use for maskable icons.
   */
  iconBackground?: string;

  context?: Record<string, AppsembleContext>;
}
