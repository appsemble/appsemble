import { editor } from 'monaco-editor';

export function applyMonacoEdits(
  ed: editor.IStandaloneCodeEditor,
  edits: editor.IIdentifiedSingleEditOperation[],
): void {
  const { readOnly } = ed.getRawOptions();
  if (readOnly) {
    ed.updateOptions({ readOnly: false });
  }
  ed.executeEdits('GUI', edits);
  if (readOnly) {
    ed.updateOptions({ readOnly });
  }
}
