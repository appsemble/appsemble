import type { BlockManifest } from '@appsemble/types';
import type { URL as URL_, URLSearchParams as URLSearchParams_ } from 'url';

/**
 * THe base arguments from the command line.
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
}

export type BlockPayload = Pick<
  BlockManifest,
  'name' | 'description' | 'actions' | 'events' | 'parameters' | 'resources' | 'version' | 'layout'
>;

export interface BlockConfig extends BlockPayload {
  webpack: string;
  dist: string;
  output: string;
  dir: string;
}

declare global {
  // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/34960
  // eslint-disable-next-line no-redeclare
  const URL: typeof URL_;
  // eslint-disable-next-line no-redeclare
  const URLSearchParams: typeof URLSearchParams_;
}
