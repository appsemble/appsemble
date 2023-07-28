export interface Argv {
  /**
   * Amount by which the logging verbosity is decreased from its default.
   */
  quiet: number;

  /**
   * Amount by which the logging verbosity is increased from its default.
   */
  verbose: number;

  /**
   * The hostname on which the Appsemble app is served.
   */
  host: string;

  /**
   * The static HTTP server port to use.
   *
   * This is the port where the app is accessible.
   *
   * @default 9090
   */
  port: number;

  /**
   * The path to the app to publish.
   */
  path?: string;

  /**
   * The Appsemble development HTTP server port to use.
   *
   * This is the port where the Appsemble development API endpoints are available.
   *
   * @default 9191
   */
  'api-port': number;

  /**
   * The remote to use synchronizing blocks.
   *
   * @default 'https://appsemble.app'
   */
  remote?: string;

  /**
   * Whether to overwrite remote blocks cache if it exists.
   */
  'overwrite-block-cache': boolean;

  /**
   * The role to set to the mocked authenticated user.
   */
  'user-role'?: string;

  /**
   * The role to set to the mocked authenticated user in the team.
   *
   * @default 'member'
   */
  'team-role'?: string;
}

const defaults: Argv = {
  quiet: 0,
  verbose: 0,
  host: 'http://localhost:9090',
  port: 9090,
  path: undefined,
  'api-port': 9191,
  remote: undefined,
  'overwrite-block-cache': false,
  'user-role': undefined,
  'team-role': undefined,
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
