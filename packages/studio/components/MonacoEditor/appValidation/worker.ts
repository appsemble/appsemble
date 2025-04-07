import {
  type IdentifiableBlock,
  iterApp,
  normalizeBlockName,
  type Prefix,
  stripBlockName,
  validateAppDefinition,
} from '@appsemble/lang-sdk';
import {
  type ActionType,
  type AppDefinition,
  type BlockManifest,
  type EventType,
  type Theme,
} from '@appsemble/types';
import {
  type editor,
  type IRange,
  type languages,
  type worker,
} from 'monaco-editor/esm/vs/editor/editor.api.js';
import { initialize } from 'monaco-worker-manager/worker';
import {
  type Document,
  isMap,
  isNode,
  isScalar,
  LineCounter,
  type Node,
  parseDocument,
} from 'yaml';

const blockMap = new Map<string, Promise<BlockManifest>>();

async function getCachedBlockVersions(blocks: IdentifiableBlock[]): Promise<BlockManifest[]> {
  const manifests = await Promise.all(
    blocks.map(({ type, version }) => {
      const url = `/api/blocks/${normalizeBlockName(type)}/versions/${version}`;
      if (!blockMap.has(url)) {
        blockMap.set(
          url,
          fetch(url).then((response) => (response.ok ? response.json() : null)),
        );
      }
      return blockMap.get(url);
    }),
  );
  return manifests.filter(Boolean);
}

let cachedYaml: [
  doc: Document.Parsed,
  lineCounter: LineCounter,
  definition: AppDefinition,
  version: number,
];
function parseYamlCached(ctx: worker.IWorkerContext, uri: string): typeof cachedYaml | [] {
  const models = ctx.getMirrorModels();
  const model = models.find((m) => String(m.uri) === uri);
  if (!model) {
    return [];
  }
  const { version } = model;
  const oldVersion = cachedYaml?.[3] ?? 0;
  if (version < oldVersion) {
    return [];
  }
  if (version > oldVersion) {
    const yaml = model.getValue();
    const lineCounter = new LineCounter();
    const doc = parseDocument(yaml, { lineCounter });
    const definition = doc.toJS({ maxAliasCount: 10_000 });
    cachedYaml = [doc, lineCounter, definition, version];
  }
  return cachedYaml;
}

export interface AppValidationWorker {
  /**
   * Perform validation of an app definition in a YAML file.
   */
  doValidation: (uri: string) => editor.IMarkerData[];

  /**
   * Get color information from a given URI.
   *
   * @param uri The URI to get color information for.
   * @returns Monaco color information.
   */
  doDocumentColors: (uri: string) => languages.IColorInformation[];

  /**
   * Fetch and cache block manifests using a local cache.
   *
   * @param blocks Identifiable blocks to get the manifest for.
   * @returns A list of block manifest that match the block manifests. If not matching manifest is
   *   found, it’s ignored.
   */

  getCachedBlockVersions: (blockMap: IdentifiableBlock[]) => BlockManifest[];

  /**
   * Get editor decorations to render inline in the app editor.
   *
   * @param uri The URI of the model to get decorations for.
   * @returns editor decorations for an app definition.
   */
  getDecorations: (uri: string) => editor.IModelDeltaDecoration[];
}

/**
 * Get the Monaco editor range for a node from the YAML AST.
 *
 * @param node The YAML node to get the range for.
 * @param lineCounter A line counter used when parsing the YAML document.
 * @returns The Monaco range that matches the YAML node
 */
function getNodeRange(node: Node, lineCounter: LineCounter): IRange {
  const [startOffset, endOffset] = node.range;
  const start = lineCounter.linePos(startOffset);
  const end = lineCounter.linePos(endOffset);
  return {
    startColumn: start.col,
    startLineNumber: start.line,
    endColumn: end.col,
    endLineNumber: end.line,
  };
}

const black = { red: 0, green: 0, blue: 0, alpha: 1 };

/**
 * Parse a hexadecimal color as a Monaco color
 *
 * @param color The hex color to parse.
 * @returns The color as a Monaco color, or black if the hex color is invalid.
 */
function parseColor(color: unknown): languages.IColor {
  if (typeof color !== 'string') {
    return black;
  }
  const parts = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
  if (!parts) {
    return black;
  }
  const result = {
    red: Number.parseInt(parts[1], 16) / 255,
    green: Number.parseInt(parts[2], 16) / 255,
    blue: Number.parseInt(parts[3], 16) / 255,
    alpha: 1,
  };
  return result;
}

function* processEventsOrActions(
  map: Record<string, ActionType | EventType>,
  node: unknown,
  lineCounter: LineCounter,
): Iterable<editor.IModelDeltaDecoration> {
  if (map && isMap(node)) {
    for (const { key } of node.items) {
      if (!isScalar(key) || typeof key.value !== 'string') {
        continue;
      }
      const value = map?.[key.value]?.description || map.$any?.description;
      if (value) {
        yield {
          range: getNodeRange(key, lineCounter),
          options: { hoverMessage: { value: `**${key}**\n\n${value}`, isTrusted: true } },
        };
      }
    }
  }
}

initialize<AppValidationWorker, unknown>((ctx: worker.IWorkerContext) => ({
  getCachedBlockVersions,

  doDocumentColors(uri) {
    const [doc, lineCounter, definition] = parseYamlCached(ctx, uri);
    if (!doc) {
      return;
    }
    const result: languages.IColorInformation[] = [];

    function handleKey(prefix: Prefix, key: keyof Theme): void {
      const node = doc.getIn([...prefix, 'theme', key], true);
      if (!isScalar(node)) {
        return;
      }

      result.push({ color: parseColor(node.value), range: getNodeRange(node, lineCounter) });
    }

    function processTheme(prefix: Prefix): void {
      handleKey(prefix, 'dangerColor');
      handleKey(prefix, 'infoColor');
      handleKey(prefix, 'linkColor');
      handleKey(prefix, 'primaryColor');
      handleKey(prefix, 'splashColor');
      handleKey(prefix, 'successColor');
      handleKey(prefix, 'themeColor');
      handleKey(prefix, 'warningColor');
    }

    processTheme([]);
    iterApp(definition, {
      onBlock(block, prefix) {
        processTheme(prefix);
      },
      onPage(page, prefix) {
        processTheme(prefix);
      },
    });
    return result;
  },

  async doValidation(uri) {
    const [doc, lineCounter, definition] = parseYamlCached(ctx, uri);
    if (!doc) {
      return;
    }
    const { errors } = await validateAppDefinition(definition, getCachedBlockVersions);

    return errors.map((error) => {
      const node = doc.getIn(error.path, true);
      const range: IRange = isNode(node)
        ? getNodeRange(node, lineCounter)
        : { startColumn: 1, startLineNumber: 1, endColumn: 1, endLineNumber: 1 };

      return {
        // The severity matches MarkerSeverity.Warning, but since this runs in a web worker and
        // `monaco-editor` uses DOM APIs, it may not be imported.
        severity: 4,
        message: error.message,
        ...range,
      };
    });
  },

  async getDecorations(uri) {
    const [doc, lineCounter, definition] = parseYamlCached(ctx, uri);
    if (!doc) {
      return;
    }
    const decorationsPromises: Promise<editor.IModelDeltaDecoration[]>[] = [];
    iterApp(definition, {
      onBlock(block, prefix) {
        decorationsPromises.push(
          Promise.resolve().then(async () => {
            const blockNode = doc.getIn(prefix, true);
            if (!isMap(blockNode)) {
              return;
            }

            const type = blockNode.get('type', true);

            if (!isScalar(type) || typeof type.value !== 'string') {
              return;
            }
            let href = `/blocks/${normalizeBlockName(type.value)}`;
            const version = blockNode.get('version');
            let manifest: BlockManifest | undefined;
            if (typeof version === 'string') {
              href += `/${version}`;
              [manifest] = await getCachedBlockVersions([block]);
            }

            if (!manifest) {
              return;
            }

            const description = manifest?.longDescription || manifest?.description || '';
            const url = new URL(href, self.location.origin);

            return [
              {
                range: getNodeRange(type, lineCounter),
                options: {
                  afterContentClassName: 'ml-1 fas fa-circle-info has-text-info is-clickable',
                  hoverMessage: {
                    value: `**${stripBlockName(
                      block.type,
                    )}**\n\n${description}\n\n[Full documentation](${url})`,
                    isTrusted: true,
                  },
                },
              },
              ...processEventsOrActions(
                manifest.actions,
                blockNode.get('actions', true),
                lineCounter,
              ),
              ...processEventsOrActions(
                manifest.events?.listen,
                blockNode.getIn(['events', 'listen'], true),
                lineCounter,
              ),
              ...processEventsOrActions(
                manifest.events?.emit,
                blockNode.getIn(['events', 'emit'], true),
                lineCounter,
              ),
            ];
          }),
        );
      },
    });
    const decorations = await Promise.all(decorationsPromises);
    return Promise.all(decorations.flat());
  },
}));
