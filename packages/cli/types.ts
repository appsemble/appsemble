import { type AppVisibility } from '@appsemble/types';
import { type PackageJson } from 'read-package-up';
import { type JsonObject } from 'type-fest';

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
   * Visibility of the app in the public app store.
   */
  visibility: AppVisibility;

  /**
   * Whether the app should be marked as a template.
   */
  template: boolean;

  /**
   * Whether the locked property should be ignored.
   */
  force: boolean;
}

// @ts-expect-error Messed up
export interface MonoRepoPackageJson extends PackageJson {
  // @ts-expect-error Messed up
  appsembleServer?: JsonObject;
}
