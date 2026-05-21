import { GlideClient } from '@valkey/valkey-glide';
import { logger } from '@appsemble/node-utils';

let valkeyClient: GlideClient | undefined;

interface InitValkeyClientOptions {
  /**
   * The host of the Valkey server. If not specified, Valkey features will be disabled.
   */
  host: string;

  /**
   * The port of the Valkey server.
   *
   * @default 6379
   */
  port: number;

  /**
   * The username to use when connecting to the Valkey server.
   *
   * @default 'default'
   */

  username?: string;

  /**
   * The password to use when connecting to the Valkey server.
   */
  password?: string;

  /**
   * Whether to use TLS when connecting to the Valkey server.
   *
   * @default false
   */
  tls?: boolean;
}

/**
 * Initializes the singleton GlideClient instance.
 *
 * @param opts Parameters for initializing the Valkey client.
 * @returns The initialized GlideClient instance, or undefined if Valkey is not configured.
 */
export async function initValkeyClient(
  opts: InitValkeyClientOptions,
): Promise<GlideClient | undefined> {
  // If Valkey is not configured (e.g., local dev without it), degrade gracefully
  if (!opts.host) {
    return undefined;
  }

  if (valkeyClient) {
    return valkeyClient;
  }

  try {
    valkeyClient = await GlideClient.createClient({
      addresses: [{ host: opts.host, port: opts.port }],
      credentials: opts.password
        ? {
            username: opts.username,
            password: opts.password,
          }
        : undefined,
      useTLS: opts.tls,
    });
    logger.info('Valkey client initialized successfully.');
    return valkeyClient;
  } catch (error) {
    logger.error('Failed to initialize Valkey GlideClient:', error);
    throw error;
  }
}

/**
 * Retrieves the initialized GlideClient.
 *
 * @returns The GlideClient instance, or undefined if Valkey is not configured.
 */
export function getValkeyClient(): GlideClient | undefined {
  return valkeyClient;
}
