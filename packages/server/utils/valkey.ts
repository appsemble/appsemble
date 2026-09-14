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
 * The client reconnects on its own when Valkey is unreachable, at startup or later.
 *
 * @param opts Parameters for initializing the Valkey client.
 * @returns The Valkey client instance, or undefined if Valkey is not configured.
 */
export async function initValkeyClient(opts: InitValkeyClientOptions): Promise<Redis | undefined> {
  // If Valkey is not configured (e.g., local dev without it), degrade gracefully
  if (!opts.host) {
    return undefined;
  }

  if (valkeyClient) {
    return valkeyClient;
  }

  const client = new Redis({
    enableOfflineQueue: false,
    host: opts.host,
    lazyConnect: true,
    password: opts.password,
    port: opts.port,
    // Keep reconnecting; with the offline queue disabled, commands fail fast in between attempts.
    retryStrategy: (times) => Math.min(times * 200, 5000),
    tls: opts.tls ? {} : undefined,
    username: opts.password ? opts.username : undefined,
  });
  client.on('error', (error: Error) => {
    logger.warn(`Valkey client error: ${error}`);
  });
  client.on('reconnecting', (delay: number) => {
    logger.warn(`Valkey connection closed, reconnecting in ${delay} ms`);
  });
  client.on('ready', () => {
    logger.info('Valkey client connected.');
  });
  valkeyClient = client;
  try {
    await client.connect();
  } catch {
    // The client keeps reconnecting in the background, so the failure is not fatal.
    logger.warn('Valkey is unreachable at startup, retrying in the background.');
  }
  return valkeyClient;
}

/**
 * Retrieves the initialized Valkey client.
 *
 * @returns The Valkey client instance, or undefined if Valkey is not configured.
 */
export function getValkeyClient(): Redis | undefined {
  return valkeyClient;
}
