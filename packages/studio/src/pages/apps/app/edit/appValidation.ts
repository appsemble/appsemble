import { validateAppDefinition } from '@appsemble/utils';
import { editor, MarkerSeverity } from 'monaco-editor/esm/vs/editor/editor.api';
import location from 'vfile-location';
import { isNode, parseDocument } from 'yaml';

import { getCachedBlockVersions } from '../../../../utils/blockRegistry';

editor.onDidCreateModel((model) => {
  const disposable = model.onDidChangeContent(() => {
    if (String(model.uri) !== 'file:///app.yaml' || model.getLanguageId() !== 'yaml') {
      return;
    }

    const startVersion = model.getVersionId();
    const yaml = model.getValue();
    const doc = parseDocument(yaml);
    const definition = doc.toJS({ maxAliasCount: 10_000 });
    validateAppDefinition(definition, getCachedBlockVersions).then(({ errors }) => {
      if (startVersion !== model.getVersionId()) {
        return;
      }
      const { toPoint } = location(yaml);

      editor.setModelMarkers(
        model,
        'app validation',
        errors.map((error) => {
          const node = doc.getIn(error.path, true);
          const [startOffset, endOffset] = isNode(node) ? node.range : [1, 1];
          const start = toPoint(startOffset);
          const end = toPoint(endOffset);

          return {
            severity: MarkerSeverity.Error,
            message: error.message,
            startColumn: start.column,
            startLineNumber: start.line,
            endColumn: end.column,
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
