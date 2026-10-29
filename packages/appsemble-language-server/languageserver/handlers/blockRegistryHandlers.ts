import { getAppBlocks, type IdentifiableBlock, parseBlockName, semver } from '@appsemble/lang-sdk';
import { isEqual as deepEquals, set } from 'lodash-es';
import { type BlockSchemaRequestHandler } from '../../BlockSchemaRequestHandler.js';
import { type Logger } from '../../Logger.js';
import { type SettingsState } from '../../yamlSettings.js';
import { type BlockManifestCacher } from '../utils/BlockManifestCacher.js';
import { type YamlCacher } from '../utils/YamlCacher.js';
import { type SettingsHandler } from './settingsHandlers.js';
import { type ValidationHandler } from './validationHandlers.js';

export class BlockRegistryHandlers {
  private yamlSettings: SettingsState;

  private readonly settingsHandler: Pick<SettingsHandler, 'applyLanguageSettings'>;

  private readonly yamlCacher: YamlCacher;

  private readonly blockManifestCacher: BlockManifestCacher;

  private readonly blockSchemaRequestHandler: BlockSchemaRequestHandler;

  private readonly logger: Logger;

  private readonly validationHandler: ValidationHandler;

  private lastAllOf: unknown = null;

  private updateCounter = 0;

  private updatePromise: Promise<boolean> | undefined;

  private isCompleteBlock(block: IdentifiableBlock): boolean {
    return Boolean(parseBlockName(block.type) && semver.test(String(block.version)));
  }

  constructor(
    yamlSettings: SettingsState,
    yamlCacher: YamlCacher,
    blockManifestCacher: BlockManifestCacher,
    blockSchemaRequestHandler: BlockSchemaRequestHandler,
    settingsHandler: Pick<SettingsHandler, 'applyLanguageSettings'>,
    validationHandler: ValidationHandler,
    logger: Logger,
  ) {
    this.yamlSettings = yamlSettings;
    this.yamlCacher = yamlCacher;
    this.blockManifestCacher = blockManifestCacher;
    this.blockSchemaRequestHandler = blockSchemaRequestHandler;
    this.settingsHandler = settingsHandler;
    this.validationHandler = validationHandler;
    this.logger = logger;
  }

  registerHandlers(): void {
    this.validationHandler.setBlockSchemaUpdater(() => this.updateBlockSchemas());
  }

  private updateBlockSchemas(): Promise<boolean> {
    if (!this.updatePromise) {
      this.updatePromise = this.doUpdateBlockSchemas().finally(() => {
        this.updatePromise = undefined;
      });
    }

    return this.updatePromise;
  }

  private async doUpdateBlockSchemas(): Promise<boolean> {
    this.updateCounter += 1;
    const updateId = this.updateCounter;
    const candidateBlocks = new Map<string, IdentifiableBlock>();
    for (const document of this.yamlSettings.documents.all()) {
      let appBlocks: IdentifiableBlock[];
      try {
        const { doc } = this.yamlCacher.parseOrGetCached(document);
        const definition = doc.toJS({ maxAliasCount: 10_000 });
        appBlocks = getAppBlocks(definition);
      } catch {
        // A partially typed page (a `flow` without `steps`, a `loop` without `foreach`, a
        // `container` without `pages`) makes app iteration throw. Skip that document so one
        // in-progress file does not abort block schema updates and validation for every open file.
        continue;
      }
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
      return false;
    }
    this.logger.log(`Updating block schemas for ${allBlocks.size} blocks`);
    const allOf = [...allBlocks.values()].map((block) => ({
      title: `${block.type} v${block.version}`,
      if: {
        required: ['type', 'version'],
        properties: {
          type: { enum: [block.type, parseBlockName(block.type)![1]] },
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
      return false;
    }
    this.updateAppsembleSchemaConfig(allOf);
    try {
      this.blockSchemaRequestHandler.availableBlockRefs = { allOf };
      // The yaml language service resolves references in place on the schemas it has loaded, which
      // turns self-referencing schemas into cyclic objects, and it cannot reset a referenced schema
      // whose URI contains an encoded character. Re-applying the settings drops every loaded schema
      // so each is parsed again from its source instead of re-resolved.
      this.settingsHandler.applyLanguageSettings();
      this.lastAllOf = allOf;
    } catch (error: unknown) {
      this.logger.error(`Error updating blockSchemaRequestHandler: ${error}`);
      return false;
    }
    this.logger.log('Updated blockSchemaRequestHandler');
    return true;
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
