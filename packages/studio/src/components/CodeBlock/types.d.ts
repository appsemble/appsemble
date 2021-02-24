/**
 * This allows us to cherry-pick the Monaco standalone editor.
 *
 * This means only a relatively small part of Monaco is imported to provide syntax highlighting.
 */
declare module 'monaco-editor/esm/vs/editor/standalone/browser/standaloneEditor' {
  export const colorizeElement: typeof import('monaco-editor').editor.colorizeElement;
}
