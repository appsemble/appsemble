import { getAppBlocks, type IdentifiableBlock, parseBlockName } from '@appsemble/lang-sdk';
import { isEqual as deepEquals } from 'lodash-es';
import { type LanguageService } from 'yaml-language-server';

import { type BlockSchemaRequestHandler } from '../../BlockSchemaRequestHandler.js';
import { type Logger } from '../../Logger.js';
import { type SettingsState } from '../../yamlSettings.js';
import { type YamlCacher } from '../utils/YamlCacher.js';

export class BlockRegistryHandlers {
  private yamlSettings: SettingsState;

  private languageService: LanguageService;

  private readonly yamlCacher: YamlCacher;

  private readonly blockSchemaRequestHandler: BlockSchemaRequestHandler;

  private readonly logger: Logger;

  private lastOneOf: unknown = null;

  constructor(
    yamlSettings: SettingsState,
    yamlCacher: YamlCacher,
    blockSchemaRequestHandler: BlockSchemaRequestHandler,
    languageService: LanguageService,
    logger: Logger,
  ) {
    this.yamlSettings = yamlSettings;
    this.yamlCacher = yamlCacher;
    this.blockSchemaRequestHandler = blockSchemaRequestHandler;
    this.languageService = languageService;
    this.logger = logger;
  }

  registerHandlers(): void {
    this.yamlSettings.documents.onDidChangeContent(() => this.updateBlockSchemas());
  }

  private updateBlockSchemas(): void {
    const allBlocks = new Map<string, IdentifiableBlock>();
    for (const document of this.yamlSettings.documents.all()) {
      const { doc } = this.yamlCacher.parseOrGetCached(document);
      const definition = doc.toJS({ maxAliasCount: 10_000 });
      const appBlocks = getAppBlocks(definition);
      for (const block of appBlocks) {
        allBlocks.set(`${block.type}@${block.version}`, block);
      }
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
    // eslint-disable-next-line unicorn/prefer-ternary
    if (this.lastOneOf == null) {
      // On the first run, we don't want to prevent the next update yet
      // The first update may not take effect while the language server is starting
      this.lastOneOf = {};
    } else {
      this.lastOneOf = oneOf;
    }
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
