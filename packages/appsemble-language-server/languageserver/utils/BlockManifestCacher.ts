import {
  type BlockManifest,
  type IdentifiableBlock,
  normalizeBlockName,
} from '@appsemble/lang-sdk';

import { type Logger } from '../../Logger.js';

/**
 * A response status is worth retrying when it is a rate limit or a transient server error.
 *
 * @param status The HTTP status code.
 * @returns Whether the request should be retried.
 */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

/**
 * Parse a `Retry-After` header into a delay in milliseconds.
 *
 * @param response The response to read the header from.
 * @returns The delay in milliseconds, or undefined when the header is absent or unparseable.
 */
function parseRetryAfter(response: Response): number | undefined {
  const header = response.headers?.get?.('retry-after');
  if (!header) {
    return undefined;
  }
  const seconds = Number(header);
  if (!Number.isNaN(seconds)) {
    return Math.max(0, seconds * 1000);
  }
  const date = Date.parse(header);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export interface BlockManifestCacherOptions {
  /**
   * How many times to retry a transient failure (rate limit, server error, network error) before
   * giving up on a block for the current update.
   */
  readonly maxRetries?: number;

  /**
   * The base delay for exponential backoff, in milliseconds.
   */
  readonly baseRetryDelayMs?: number;

  /**
   * The maximum delay between retries, in milliseconds. Also caps a server provided `Retry-After`.
   */
  readonly maxRetryDelayMs?: number;
}

export class BlockManifestCacher {
  private apiBaseUrl: string;

  private readonly blockMap = new Map<string, Promise<BlockManifest | null>>();

  private readonly logger: Logger;

  private readonly maxRetries: number;

  private readonly baseRetryDelayMs: number;

  private readonly maxRetryDelayMs: number;

  constructor(apiBaseUrl: string, logger: Logger, options: BlockManifestCacherOptions = {}) {
    this.apiBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
    this.logger = logger;
    this.maxRetries = options.maxRetries ?? 3;
    this.baseRetryDelayMs = options.baseRetryDelayMs ?? 500;
    this.maxRetryDelayMs = options.maxRetryDelayMs ?? 10_000;
  }

  /**
   * Resolve the manifests for the given blocks.
   *
   * Each block is fetched independently: a block that cannot be resolved (missing, or still failing
   * after retries) is left out of the result instead of failing the whole batch. This keeps a
   * single rate limited or unreachable block from discarding every other block's schema.
   *
   * @param blocks The blocks to resolve manifests for.
   * @returns The manifests that could be resolved.
   */
  async getCachedBlockVersions(blocks: IdentifiableBlock[]): Promise<BlockManifest[]> {
    const manifests = await Promise.all(blocks.map((block) => this.getBlockManifest(block)));
    return manifests.filter((manifest): manifest is BlockManifest => manifest != null);
  }

  private getBlockManifest(block: IdentifiableBlock): Promise<BlockManifest | null> {
    const url = new URL(
      `/api/blocks/${normalizeBlockName(block.type)}/versions/${block.version}`,
      this.apiBaseUrl,
    ).href;
    const cached = this.blockMap.get(url);
    if (cached) {
      return cached;
    }
    const request = this.fetchManifest(url).then((manifest) => {
      // Only successful manifests stay cached. Anything else is evicted so it is retried on the
      // next update once the registry recovers.
      if (manifest == null) {
        this.blockMap.delete(url);
      }
      return manifest;
    });
    this.blockMap.set(url, request);
    return request;
  }

  private async fetchManifest(url: string): Promise<BlockManifest | null> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          return (await response.json()) as BlockManifest;
        }
        if (!isRetryableStatus(response.status) || attempt >= this.maxRetries) {
          this.logger.log(`Block request for ${url} returned status ${response.status}`);
          return null;
        }
        this.logger.log(
          `Block request for ${url} returned status ${response.status}, retrying (attempt ${attempt + 1}/${this.maxRetries})`,
        );
        await delay(this.retryDelay(attempt, response));
      } catch (error) {
        if (attempt >= this.maxRetries) {
          this.logger.error(`Block request for ${url} failed: ${error}`);
          return null;
        }
        this.logger.log(
          `Block request for ${url} failed, retrying (attempt ${attempt + 1}/${this.maxRetries})`,
        );
        await delay(this.retryDelay(attempt));
      }
    }
  }

  private retryDelay(attempt: number, response?: Response): number {
    const retryAfter = response && parseRetryAfter(response);
    if (retryAfter != null) {
      return Math.min(retryAfter, this.maxRetryDelayMs);
    }
    return Math.min(this.baseRetryDelayMs * 2 ** attempt, this.maxRetryDelayMs);
  }

  get apiUrl(): string {
    return this.apiBaseUrl;
  }

  set apiUrl(val: string) {
    this.apiBaseUrl = val;
    this.logger.log(`Set the apiBase: ${this.apiBaseUrl}`);
  }

  get blocks(): typeof this.blockMap {
    return this.blockMap;
  }
}
