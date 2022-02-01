import { BlockManifest, Theme } from '@appsemble/types';
import { BlockVersionsGetter, iterApp, Prefix, validateAppDefinition } from '@appsemble/utils';
import { editor, IRange, languages, worker } from 'monaco-editor/esm/vs/editor/editor.api';
// @ts-expect-error This module is untyped.
import { initialize } from 'monaco-editor/esm/vs/editor/editor.worker';
import { Promisable } from 'type-fest';
import { isNode, isScalar, LineCounter, Node, parseDocument } from 'yaml';

const blockMap = new Map<string, Promise<BlockManifest>>();

const getCachedBlockVersions: BlockVersionsGetter = async (blocks) => {
  const manifests = await Promise.all(
    blocks.map(({ type, version }) => {
      const url = `/api/blocks/${type}/versions/${version}`;
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
};

export interface AppValidationWorker {
  /**
   * Perform validation of an app definition in a YAML file.
   */
  doValidation: (uri: string) => Promise<editor.IMarkerData[]>;

  /**
   * Get color information from a given URI.
   *
   * @param uri - The URI to get color information for.
   * @returns Monaco color information.
   */
  doDocumentColors: (uri: string) => Promisable<languages.IColorInformation[]>;

  /**
   * Fetch and cache block manifests usng a local cache.
   *
   * @param blocks - Identifiable blocks to get the manifest for.
   * @returns A list of block manifest that match the block manifests. If not matching manifest is
   * found, it’s ignored.
   */
  getCachedBlockVersions: BlockVersionsGetter;
}

/**
 * Get the Monaco editor range for a node from the YAML AST.
 *
 * @param node - The YAML node to get the range for.
 * @param lineCounter - A line counter used when parsing the YAML document.
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
 * @param color - The hex color to parse.
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

self.onmessage = () => {
  initialize((ctx: worker.IWorkerContext) => {
    const implementation: AppValidationWorker = {
      getCachedBlockVersions,

      doDocumentColors(uri) {
        const models = ctx.getMirrorModels();
        const model = models.find((m) => String(m.uri) === uri);
        const yaml = model.getValue();
        const lineCounter = new LineCounter();
        const doc = parseDocument(yaml, { lineCounter });
        const definition = doc.toJS({ maxAliasCount: 10_000 });
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
        const models = ctx.getMirrorModels();
        const model = models.find((m) => String(m.uri) === uri);
        const yaml = model.getValue();
        const lineCounter = new LineCounter();
        const doc = parseDocument(yaml, { lineCounter });
        const definition = doc.toJS({ maxAliasCount: 10_000 });
        const { errors } = await validateAppDefinition(definition, getCachedBlockVersions);

        return errors.map((error) => {
          const node = doc.getIn(error.path, true);
          const range: IRange = isNode(node)
            ? getNodeRange(node, lineCounter)
            : { startColumn: 1, startLineNumber: 1, endColumn: 1, endLineNumber: 1 };

          return {
            // The severity matches MarkerSeverity.Error, but since this runs in a web worker and
            // `monaco-editor` used DOM APIs, it may not be imported.
            severity: 8,
            message: error.message,
            ...range,
          };
        });
      },
    };

    // Monaco expects properties to exist on the prototype, not on the own instance.
    return Object.create(implementation);
  });
};
