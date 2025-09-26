import {
  type BlockManifest,
  type IdentifiableBlock,
  normalizeBlockName,
} from '@appsemble/lang-sdk';

import { type Logger } from '../../Logger.js';

export class BlockManifestCacher {
  private apiBaseUrl: string;

  private readonly blockMap = new Map<string, Promise<BlockManifest>>();

  private readonly logger: Logger;

  constructor(apiBaseUrl: string, logger: Logger) {
    this.apiBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.logger = logger ?? (() => {});
  }

  async getCachedBlockVersions(blocks: IdentifiableBlock[]): Promise<BlockManifest[]> {
    const manifests = await Promise.all(
      blocks.map(({ type, version }) => {
        const url = new URL(
          `/api/blocks/${normalizeBlockName(type)}/versions/${version}`,
          this.apiBaseUrl,
        ).href;
        if (this.blockMap.has(url)) {
          this.logger.info(`Getting block from cache: ${url}`);
          return this.blockMap.get(url);
        }
        this.logger.info(`Fetching block URL: ${url}`);
        const response = fetch(url)
          .then((resp) => (resp.ok ? resp.json() : null))
          .then((data) => {
            this.logger.info(`Fetched block URL: ${url}`);
            this.logger.info(data ? 'Block has data' : 'Block has no data');
            return data;
          });
        return this.blockMap.set(url, response).get(url);
      }),
    );
    return manifests.filter((manifest) => manifest != null && manifest !== undefined);
  }

  get apiUrl(): string {
    return this.apiBaseUrl;
  }

  set apiUrl(val: string) {
    this.apiBaseUrl = val;
    this.logger.info(`Set the apiBase: ${this.apiBaseUrl}`);
  }

  get blocks(): typeof this.blockMap {
    return this.blockMap;
  }
}
