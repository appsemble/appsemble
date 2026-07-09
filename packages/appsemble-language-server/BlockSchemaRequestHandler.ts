import { type BlockManifest, partialNormalized, partialSemver } from '@appsemble/lang-sdk';

import { type BlockManifestCacher } from './languageserver/utils/BlockManifestCacher.js';
import { type Logger } from './Logger.js';
import { type SchemaRequestChainHandler } from './SchemaRequestWrapper.js';

interface AvailBlocksRefOneOf {
  allOf: {
    title: string;
    if: {
      required: string[];
      properties: {
        type: unknown;
        version: unknown;
      };
    };
    then: {
      properties: {
        parameters: { $ref: string };
        actions: { $ref: string };
        events: { $ref: string };
      };
    };
  }[];
}

const blockParametersRegex = new RegExp(
  String.raw`^appsemble://blocks/(@|%40)${partialNormalized.source}/${partialNormalized.source}/(${partialSemver.source})/parameters\.json$`,
);
const blockActionsRegex = new RegExp(
  String.raw`^appsemble://blocks/(@|%40)${partialNormalized.source}/${partialNormalized.source}/(${partialSemver.source})/actions\.json$`,
);
const blockEventsRegex = new RegExp(
  String.raw`^appsemble://blocks/(@|%40)${partialNormalized.source}/${partialNormalized.source}/(${partialSemver.source})/events\.json$`,
);

function getBlockRequest(match: RegExpMatchArray): { blockName: string; version: string } {
  const [, at, org, type, version] = match;
  const organization = `${at === '%40' ? '@' : at}${org}`;
  return { blockName: `${organization}/${type}`, version };
}

export class BlockSchemaRequestHandler implements SchemaRequestChainHandler {
  private readonly logger: Logger;

  private readonly blockManifestCacher: BlockManifestCacher;

  private availBlockRefs: AvailBlocksRefOneOf = { allOf: [] };

  constructor(blockManifestCacher: BlockManifestCacher, logger: Logger) {
    this.blockManifestCacher = blockManifestCacher;
    this.logger = logger;
  }

  get availableBlockRefs(): AvailBlocksRefOneOf {
    return this.availBlockRefs;
  }

  set availableBlockRefs(blocks: AvailBlocksRefOneOf) {
    this.availBlockRefs = blocks;
  }

  handle(uri: string): Promise<string | null> {
    this.logger.log(`Schema request for ${uri}`);

    if (uri.toLowerCase() === 'appsemble://availBlocksRef.json'.toLowerCase()) {
      return Promise.resolve(this.handleBlockRefs());
    }

    const blockParametersMatch = uri.match(blockParametersRegex);
    if (blockParametersMatch) {
      const { blockName, version } = getBlockRequest(blockParametersMatch);
      this.logger.log(`Block parameters schema request for ${blockName} version ${version}`);
      return this.handleBlockParameters(blockName, version);
    }
    const blockActionsMatch = uri.match(blockActionsRegex);
    if (blockActionsMatch) {
      const { blockName, version } = getBlockRequest(blockActionsMatch);
      this.logger.log(`Block actions schema request for ${blockName} version ${version}`);
      return this.handleBlockActions(blockName, version);
    }
    const blockEventsMatch = uri.match(blockEventsRegex);
    if (blockEventsMatch) {
      const { blockName, version } = getBlockRequest(blockEventsMatch);
      this.logger.log(`Block events schema request for ${blockName} version ${version}`);
      return this.handleBlockEvents(blockName, version);
    }
    this.logger.log(`No block schema found for ${uri}`);
    return Promise.resolve(null);
  }

  private async handleBlockEvents(type: string, version: string): Promise<string | null> {
    const manifest = await this.getBlockManifest(type, version);
    if (!manifest) {
      return null;
    }
    if (!manifest.events) {
      return JSON.stringify({});
    }
    const schema = {
      type: 'object',
      properties: {
        emit: {
          type: 'object',
          properties: {} as Record<string, { type: string; description: string }>,
        },
        listen: {
          type: 'object',
          properties: {} as Record<string, { type: string; description: string }>,
          additionalProperties: false as boolean | { type: string; description: string },
        },
      },
    };
    for (const event of Object.keys(manifest.events.emit ?? {})) {
      schema.properties.emit.properties[event] = {
        type: 'string',
        description: manifest.events.emit?.[event].description ?? '',
      };
    }
    for (const event of Object.keys(manifest.events.listen ?? {})) {
      if (event === '$any') {
        schema.properties.listen.additionalProperties = {
          type: 'string',
          description: manifest.events.listen?.[event].description ?? 'Any event',
        };
      } else {
        schema.properties.listen.properties[event] = {
          type: 'string',
          description: manifest.events.listen?.[event].description ?? '',
        };
      }
    }
    return JSON.stringify(schema);
  }

  private async handleBlockActions(type: string, version: string): Promise<string | null> {
    const manifest = await this.getBlockManifest(type, version);
    if (!manifest) {
      return null;
    }
    if (!manifest.actions) {
      return JSON.stringify({});
    }
    const schema = {
      type: 'object',
      properties: {} as Record<string, { type: string; description: string }>,
      additionalProperties: false as boolean | { type: string; description: string },
    };
    for (const action of Object.keys(manifest.actions)) {
      if (action === '$any') {
        schema.additionalProperties = {
          type: 'object',
          description: manifest.actions[action].description ?? 'Any action',
        };
      } else {
        schema.properties[action] = {
          type: 'object',
          description: manifest.actions[action].description ?? '',
        };
      }
    }
    return JSON.stringify(schema);
  }

  private async handleBlockParameters(type: string, version: string): Promise<string | null> {
    const manifest = await this.getBlockManifest(type, version);
    return manifest ? JSON.stringify(manifest.parameters) : null;
  }

  private async getBlockManifest(type: string, version: string): Promise<BlockManifest | null> {
    const manifests = await this.blockManifestCacher.getCachedBlockVersions([{ type, version }]);
    if (manifests.length === 0) {
      this.logger.log(`No manifest found for block ${type} version ${version}`);
      return null;
    }
    return manifests[0];
  }

  private handleBlockRefs(): string | null {
    return JSON.stringify(this.availBlockRefs);
  }
}
