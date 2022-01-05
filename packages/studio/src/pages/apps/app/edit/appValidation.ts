import { validateAppDefinition } from '@appsemble/utils';
import { editor, MarkerSeverity } from 'monaco-editor/esm/vs/editor/editor.api';
import { isNode, LineCounter, parseDocument } from 'yaml';

import { getCachedBlockVersions } from '../../../../utils/blockRegistry';

editor.onDidCreateModel((model) => {
  const disposable = model.onDidChangeContent(() => {
    if (String(model.uri) !== 'file:///app.yaml' || model.getLanguageId() !== 'yaml') {
      return;
    }

    const startVersion = model.getVersionId();
    const yaml = model.getValue();
    const lineCounter = new LineCounter();
    const doc = parseDocument(yaml, { lineCounter });
    const definition = doc.toJS({ maxAliasCount: 10_000 });
    validateAppDefinition(definition, getCachedBlockVersions).then(({ errors }) => {
      if (startVersion !== model.getVersionId()) {
        return;
      }

      editor.setModelMarkers(
        model,
        'app validation',
        errors.map((error) => {
          const node = doc.getIn(error.path, true);
          const [startOffset, endOffset] = isNode(node) ? node.range : [1, 1];
          const start = lineCounter.linePos(startOffset);
          const end = lineCounter.linePos(endOffset);

          return {
            severity: MarkerSeverity.Error,
            message: error.message,
            startColumn: start.col,
            startLineNumber: start.line,
            endColumn: end.col,
            endLineNumber: end.line,
          };
        }),
      );
    });
  });
  model.onWillDispose(() => {
    disposable.dispose();
  });
});
