import { getAppBlocks, type IdentifiableBlock, parseBlockName, semver } from '@appsemble/lang-sdk';
import { isEqual as deepEquals } from 'lodash-es';
import { type LanguageService } from 'yaml-language-server';

import { type BlockSchemaRequestHandler } from '../../BlockSchemaRequestHandler.js';
import { type Logger } from '../../Logger.js';
import { type SettingsState } from '../../yamlSettings.js';
import { type BlockManifestCacher } from '../utils/BlockManifestCacher.js';
import { type YamlCacher } from '../utils/YamlCacher.js';

export class BlockRegistryHandlers {
  private yamlSettings: SettingsState;

  private languageService: LanguageService;

  private readonly yamlCacher: YamlCacher;

  private readonly blockManifestCacher: BlockManifestCacher;

  private readonly blockSchemaRequestHandler: BlockSchemaRequestHandler;

  private readonly logger: Logger;

  private lastOneOf: unknown = null;

  private updateCounter = 0;

  private isCompleteBlock(block: IdentifiableBlock): boolean {
    return Boolean(parseBlockName(block.type) && semver.test(String(block.version)));
  }

  constructor(
    yamlSettings: SettingsState,
    yamlCacher: YamlCacher,
    blockManifestCacher: BlockManifestCacher,
    blockSchemaRequestHandler: BlockSchemaRequestHandler,
    languageService: LanguageService,
    logger: Logger,
  ) {
    this.yamlSettings = yamlSettings;
    this.yamlCacher = yamlCacher;
    this.blockManifestCacher = blockManifestCacher;
    this.blockSchemaRequestHandler = blockSchemaRequestHandler;
    this.languageService = languageService;
    this.logger = logger;
  }

  registerHandlers(): void {
    this.yamlSettings.documents.onDidChangeContent(() => {
      this.updateBlockSchemas().catch((error: unknown) => {
        this.logger.error(`Error updating block schemas: ${error}`);
      });
    });
  }

  private async updateBlockSchemas(): Promise<void> {
    this.updateCounter += 1;
    const updateId = this.updateCounter;
    const candidateBlocks = new Map<string, IdentifiableBlock>();
    for (const document of this.yamlSettings.documents.all()) {
      const { doc } = this.yamlCacher.parseOrGetCached(document);
      const definition = doc.toJS({ maxAliasCount: 10_000 });
      const appBlocks = getAppBlocks(definition);
      for (const block of appBlocks) {
        if (!this.isCompleteBlock(block)) {
          continue;
        }
        candidateBlocks.set(`${block.type}@${block.version}`, block);
      }
    }
    const allBlocks = new Map(
      (
        await Promise.all(
          [...candidateBlocks].map(async ([key, block]) => {
            const [manifest] = await this.blockManifestCacher.getCachedBlockVersions([block]);
            return manifest ? ([key, block] as const) : null;
          }),
        )
      ).filter((block): block is readonly [string, IdentifiableBlock] => block != null),
    );
    if (updateId !== this.updateCounter) {
      this.logger.log('Skipping stale block schema update');
      return;
    }
    this.logger.log(
      `Updating block schemas for ${allBlocks.size} blocks: ${[...allBlocks.keys()].join(', ')}`,
    );
    const oneOf = [...allBlocks.values()].map((block) => ({
      title: `${block.type} v${block.version}`,
      properties: {
        type: { oneOf: [{ const: block.type }, { const: parseBlockName(block.type)![1] }] },
        version: { const: block.version },
        parameters: {
          $ref: `appsemble://blocks/${block.type}/${block.version}/parameters.json`,
        },
        actions: {
          $ref: `appsemble://blocks/${block.type}/${block.version}/actions.json`,
        },
        events: {
          $ref: `appsemble://blocks/${block.type}/${block.version}/events.json`,
        },
      },
    }));
    if (deepEquals(oneOf, this.lastOneOf)) {
      this.logger.log('Block schemas unchanged, not updating');
      return;
    }
    this.lastOneOf = oneOf;
    try {
      this.blockSchemaRequestHandler.availableBlockRefs = { oneOf };
    } catch (error: unknown) {
      this.logger.error(`Error updating blockSchemaRequestHandler: ${error}`);
    }
    this.logger.log('Updated blockSchemaRequestHandler');
    this.logger.log('Resetting schema: appsemble://availBlocksRef.json');
    this.languageService.resetSchema('appsemble://availBlocksRef.json');
  }
}
