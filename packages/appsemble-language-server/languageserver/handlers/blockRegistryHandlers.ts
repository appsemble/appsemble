import { getAppBlocks, type IdentifiableBlock, parseBlockName, semver } from '@appsemble/lang-sdk';
import { isEqual as deepEquals, set } from 'lodash-es';
import { type LanguageService } from 'yaml-language-server';
import { MODIFICATION_ACTIONS } from 'yaml-language-server/lib/esm/languageservice/services/yamlSchemaService.js';

import { type BlockSchemaRequestHandler } from '../../BlockSchemaRequestHandler.js';
import { type Logger } from '../../Logger.js';
import { type SettingsState } from '../../yamlSettings.js';
import { type BlockManifestCacher } from '../utils/BlockManifestCacher.js';
import { type YamlCacher } from '../utils/YamlCacher.js';
import { type ValidationHandler } from './validationHandlers.js';

export class BlockRegistryHandlers {
  private yamlSettings: SettingsState;

  private languageService: LanguageService;

  private readonly yamlCacher: YamlCacher;

  private readonly blockManifestCacher: BlockManifestCacher;

  private readonly blockSchemaRequestHandler: BlockSchemaRequestHandler;

  private readonly logger: Logger;

  private readonly validationHandler: ValidationHandler;

  private lastAllOf: unknown = null;

  private updateCounter = 0;

  private updateTimeout: NodeJS.Timeout | undefined;

  private isCompleteBlock(block: IdentifiableBlock): boolean {
    return Boolean(parseBlockName(block.type) && semver.test(String(block.version)));
  }

  constructor(
    yamlSettings: SettingsState,
    yamlCacher: YamlCacher,
    blockManifestCacher: BlockManifestCacher,
    blockSchemaRequestHandler: BlockSchemaRequestHandler,
    languageService: LanguageService,
    validationHandler: ValidationHandler,
    logger: Logger,
  ) {
    this.yamlSettings = yamlSettings;
    this.yamlCacher = yamlCacher;
    this.blockManifestCacher = blockManifestCacher;
    this.blockSchemaRequestHandler = blockSchemaRequestHandler;
    this.languageService = languageService;
    this.validationHandler = validationHandler;
    this.logger = logger;
  }

  registerHandlers(): void {
    this.yamlSettings.documents.onDidChangeContent(() => {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = setTimeout(() => {
        this.updateBlockSchemas().catch((error: unknown) => {
          this.logger.error(`Error updating block schemas: ${error}`);
        });
      }, this.yamlSettings.validationDelayMs);
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
    this.logger.log(`Updating block schemas for ${allBlocks.size} blocks`);
    const allOf = [...allBlocks.values()].map((block) => ({
      title: `${block.type} v${block.version}`,
      if: {
        required: ['type', 'version'],
        properties: {
          type: { oneOf: [{ const: block.type }, { const: parseBlockName(block.type)![1] }] },
          version: { const: block.version },
        },
      },
      then: {
        properties: {
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
      },
    }));
    if (deepEquals(allOf, this.lastAllOf)) {
      this.logger.log('Block schemas unchanged, not updating');
      return;
    }
    this.lastAllOf = allOf;
    this.updateAppsembleSchemaConfig(allOf);
    try {
      this.blockSchemaRequestHandler.availableBlockRefs = { allOf };
      await Promise.resolve(
        this.languageService.modifySchemaContent({
          action: MODIFICATION_ACTIONS.add,
          schema: 'appsemble://schema.json',
          path: 'definitions/BlockDefinition/allOf',
          key: '0',
          content: { allOf },
        }),
      );
      this.languageService.resetSchema('appsemble://schema.json');
    } catch (error: unknown) {
      this.logger.error(`Error updating blockSchemaRequestHandler: ${error}`);
    }
    this.logger.log('Updated blockSchemaRequestHandler');
    for (const document of this.yamlSettings.documents.all()) {
      this.validationHandler.validate(document);
    }
  }

  private updateAppsembleSchemaConfig(allOf: unknown[]): void {
    const appsembleSchema = this.yamlSettings.schemaConfigurationSettings.find(
      (schema) => schema.uri === 'appsemble://schema.json',
    )?.schema;

    if (appsembleSchema && typeof appsembleSchema === 'object') {
      set(appsembleSchema, 'definitions.BlockDefinition.allOf.0', { allOf });
    }
  }
}
