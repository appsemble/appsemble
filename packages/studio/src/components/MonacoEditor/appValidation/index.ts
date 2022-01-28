import { editor, languages, Uri } from 'monaco-editor/esm/vs/editor/editor.api.js';
import { BlockVersionsGetter } from 'utils/src/validation';

import { AppValidationWorker } from './worker';

export const appValidationLabel = 'appValidation';

let worker: editor.MonacoWebWorker<AppValidationWorker>;
let clientPromise: Promise<AppValidationWorker>;

async function getClient(...resources: Uri[]): Promise<AppValidationWorker> {
  if (!clientPromise) {
    worker = editor.createWebWorker<AppValidationWorker>({
      moduleId: appValidationLabel,
      label: appValidationLabel,
    });
    clientPromise = worker.getProxy();
  }
  await worker.withSyncedResources(resources);
  return clientPromise;
}

export const getCachedBlockVersions: BlockVersionsGetter = async (blocks) => {
  const client = await getClient();
  return client.getCachedBlockVersions(blocks);
};

editor.onDidCreateModel((model) => {
  const disposable = model.onDidChangeContent(async () => {
    if (String(model.uri) !== 'file:///app.yaml' || model.getLanguageId() !== 'yaml') {
      return;
    }

    const startVersion = model.getVersionId();
    const client = await getClient(model.uri);
    const markers = await client.doValidation(String(model.uri));
    if (startVersion === model.getVersionId()) {
      editor.setModelMarkers(model, appValidationLabel, markers);
    }
  });

  model.onWillDispose(() => {
    disposable.dispose();
  });
});

function toHex(number: number): string {
  return Math.floor(number * 255)
    .toString(16)
    .padStart(2, '0');
}

languages.registerColorProvider('yaml', {
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
    const client = await getClient(model.uri);
    return client.doDocumentColors(String(model.uri));
  },
});
