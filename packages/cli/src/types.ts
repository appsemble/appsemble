import { BlockManifest } from '@appsemble/types';
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

export interface BlockConfig
  extends Pick<
    BlockManifest,
    | 'actions'
    | 'description'
    | 'events'
    | 'layout'
    | 'longDescription'
    | 'name'
    | 'parameters'
    | 'resources'
    | 'version'
  > {
  /**
   * The path to the webpack configuration file relative to the block project directory.
   */
  webpack: string;

  /**
   * The build output directory relative to the block project directory.
   */
  output: string;

  /**
   * The absolute directory of the block project.
   */
  dir: string;
}

export interface MonoRepoPackageJson extends PackageJson {
  appsembleServer?: JsonObject;
}

export interface AppsembleRC {
  /**
   * The background color to use for maskable icons.
   */
  iconBackground?: string;
}
