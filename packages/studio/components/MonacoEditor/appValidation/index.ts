import { type BlockVersionsGetter } from '@appsemble/lang-sdk';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import { registerMarkerDataProvider } from 'monaco-marker-data-provider';
import { createWorkerManager } from 'monaco-worker-manager';

import { type AppValidationWorker } from './worker.js';

export const appValidationLabel = 'appValidation';

const workerManager = createWorkerManager<AppValidationWorker>(monaco, {
  label: appValidationLabel,
  moduleId: appValidationLabel,
});

export const getCachedBlockVersions: BlockVersionsGetter = async (blocks) => {
  const client = await workerManager.getWorker();
  return client.getCachedBlockVersions(blocks);
};

registerMarkerDataProvider(monaco, 'yaml', {
  owner: appValidationLabel,

  async provideMarkerData(model) {
    if (String(model.uri) !== 'file:///app.yaml' || model.getLanguageId() !== 'yaml') {
      return;
    }
    const client = await workerManager.getWorker(model.uri);
    return client.doValidation(String(model.uri));
  },
});

monaco.editor.onDidCreateModel((model) => {
  const modelMap = new WeakMap<monaco.editor.ITextModel, string[]>();

  const disposable = model.onDidChangeContent(async () => {
    if (String(model.uri) !== 'file:///app.yaml' || model.getLanguageId() !== 'yaml') {
      return;
    }

    const client = await workerManager.getWorker(model.uri);
    const markers = await client.getDecorations(String(model.uri));
    modelMap.set(model, model.deltaDecorations(modelMap.get(model) ?? [], markers));
  });

  model.onWillDispose(() => {
    disposable.dispose();
    modelMap.delete(model);
  });
});

function toHex(number: number): string {
  return Math.floor(number * 255)
    .toString(16)
    .padStart(2, '0');
}

monaco.languages.registerColorProvider('yaml', {
  provideColorPresentations(model, { color, range }) {
    const currentQuote = model.getValueInRange({
      startLineNumber: range.startLineNumber,
      startColumn: range.startColumn,
      endLineNumber: range.startLineNumber,
      endColumn: range.startColumn + 1,
    });
    const hex = `#${toHex(color.red)}${toHex(color.green)}${toHex(color.blue)}`;
    const quote = currentQuote === '"' ? currentQuote : "'";
    return [
      {
        label: hex,
        textEdit: {
          range,
          text: `${quote}${hex}${quote}`,
        },
      },
    ];
  },

  async provideDocumentColors(model) {
    const client = await workerManager.getWorker(model.uri);
    return client.doDocumentColors(String(model.uri));
  },
});
