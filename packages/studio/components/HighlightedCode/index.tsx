import { type ReactElement, useEffect, useRef } from 'react';

export interface HighlightedCodeProps {
  /**
   * A class name to add to the `pre` element.
   */
  className?: string;

  /**
   * The code to render.
   */
  children: string;
}

const languageRegex = /\blanguage-(\w+)/;

/**
 * Render code using syntax highlighting based on Monaco editor.
 *
 * Don’t use this directly. Use @see CodeBlock instead.
 */
export function HighlightedCode({ children, className }: HighlightedCodeProps): ReactElement {
  const ref = useRef<HTMLPreElement>();

  const language = languageRegex.exec(className)?.[1];

  useEffect(() => {
    if (language) {
      Promise.all([
        import('monaco-editor/esm/vs/editor/editor.api.js'),
        import('../MonacoEditor/languages.js'),
      ]).then(([{ editor }]) => {
        editor.colorizeElement(ref.current, { mimeType: language, theme: 'vs' });
      });
    }
  }, [language]);

  return (
    <code className={className} ref={ref}>
      {children?.trimEnd()}
    </code>
  );
}
