import { logger } from '@appsemble/node-utils';
import { Redis } from 'ioredis';

let valkeyClient: Redis | undefined;

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
 * Initializes the singleton Valkey client instance.
 *
 * @param opts Parameters for initializing the Valkey client.
 * @returns The initialized Valkey client instance, or undefined if Valkey is not configured.
 */
export async function initValkeyClient(opts: InitValkeyClientOptions): Promise<Redis | undefined> {
  // If Valkey is not configured (e.g., local dev without it), degrade gracefully
  if (!opts.host) {
    return undefined;
  }

  if (valkeyClient) {
    return valkeyClient;
  }

  let client: Redis | undefined;
  try {
    client = new Redis({
      enableOfflineQueue: false,
      host: opts.host,
      lazyConnect: true,
      password: opts.password,
      port: opts.port,
      retryStrategy: () => null,
      tls: opts.tls ? {} : undefined,
      username: opts.password ? opts.username : undefined,
    });
    client.on('error', (error: Error) => {
      logger.warn(`Valkey client error: ${error}`);
    });
    await client.connect();
    valkeyClient = client;
    logger.info('Valkey client initialized successfully.');
    return valkeyClient;
  } catch (error) {
    client?.disconnect();
    logger.error('Failed to initialize Valkey client:', error);
    throw error;
  }
}

/**
 * Retrieves the initialized Valkey client.
 *
 * @returns The Valkey client instance, or undefined if Valkey is not configured.
 */
export function getValkeyClient(): Redis | undefined {
  return valkeyClient;
}
