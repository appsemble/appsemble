import { logger, type AppServingCache, type AppServingCacheResult } from '@appsemble/node-utils';

import { argv } from './argv.js';
import { getValkeyClient } from './valkey.js';

interface ServerJsonCacheConfig {
  prefix: string;
  ttl: number;
}

type ServerJsonCacheConfigProvider = () => ServerJsonCacheConfig;

function getAppServingCacheConfig(): ServerJsonCacheConfig {
  return {
    prefix: 'appsemble',
    ttl: argv.appServingCacheTtl,
  };
}

export class ServerJsonCache implements AppServingCache {
  private readonly getConfig: ServerJsonCacheConfigProvider;

  constructor(getConfig: ServerJsonCacheConfigProvider) {
    this.getConfig = getConfig;
  }

  private getResolvedConfig(): ServerJsonCacheConfig | null {
    const config = this.getConfig();

    if (!config.ttl || config.ttl < 1) {
      return null;
    }

    return config;
  }

  private getKey(key: string, prefix: string): string {
    return `${prefix}:${key}`;
  }

  async get<T>(key: string): Promise<AppServingCacheResult<T>> {
    const config = this.getResolvedConfig();
    const client = getValkeyClient();
    if (!config || !client) {
      return { status: 'disabled' };
    }

    try {
      const value = await client.get(this.getKey(key, config.prefix));

      return value == null
        ? { status: 'miss' }
        : { status: 'hit', value: JSON.parse(value.toString()) };
    } catch (error: unknown) {
      logger.warn(`Valkey cache get failed for ${key}: ${error}`);
      return { status: 'error' };
    }
  }

  async set<T>(key: string, value: T): Promise<AppServingCacheResult<T>['status']> {
    const config = this.getResolvedConfig();
    const client = getValkeyClient();
    if (!config || !client) {
      return 'disabled';
    }

    try {
      await client.set(this.getKey(key, config.prefix), JSON.stringify(value), 'EX', config.ttl);
      return 'miss';
    } catch (error: unknown) {
      logger.warn(`Valkey cache set failed for ${key}: ${error}`);
      return 'error';
    }
  }
}

export const appServingCache = new ServerJsonCache(getAppServingCacheConfig);
