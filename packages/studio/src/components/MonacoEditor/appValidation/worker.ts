import { BlockManifest } from '@appsemble/types';
import { BlockVersionsGetter, validateAppDefinition } from '@appsemble/utils';
import { editor, worker } from 'monaco-editor/esm/vs/editor/editor.api';
// @ts-expect-error This module is untyped.
import { initialize } from 'monaco-editor/esm/vs/editor/editor.worker';
import { isNode, LineCounter, parseDocument } from 'yaml';

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
   * Fetch and cache block manifests usng a local cache.
   *
   * @param blocks - Identifiable blocks to get the manifest for.
   * @returns A list of block manifest that match the block manifests. If not matching manifest is
   * found, it’s ignored.
   */
  getCachedBlockVersions: BlockVersionsGetter;
}

self.onmessage = () => {
  initialize((ctx: worker.IWorkerContext) => {
    const implementation: AppValidationWorker = {
      getCachedBlockVersions,

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
          const [startOffset, endOffset] = isNode(node) ? node.range : [1, 1];
          const start = lineCounter.linePos(startOffset);
          const end = lineCounter.linePos(endOffset);

          return {
            // The severity matches MarkerSeverity.Error, but since this runs in a web worker and
            // `monaco-editor` used DOM APIs, it may not be imported.
            severity: 8,
            message: error.message,
            startColumn: start.col,
            startLineNumber: start.line,
            endColumn: end.col,
            endLineNumber: end.line,
          };
        });
      },
    };

    // Monaco expects properties to exist on the prototype, not on the own instance.
    return Object.create(implementation);
  });
};
