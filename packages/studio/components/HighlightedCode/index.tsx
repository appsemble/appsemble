import { type ReactElement, useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { prism as style } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
 * Don't use this directly. Use @see CodeBlock instead.
 */
export function HighlightedCode({ children, className }: HighlightedCodeProps): ReactElement {
  const ref = useRef<HTMLPreElement>();

  const language = languageRegex.exec(className)?.[1];

  useEffect(() => {
    if (language && language !== 'json') {
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
      {language === 'json' ? (
        <SyntaxHighlighter language="json" style={style}>
          {children?.trimEnd()}
        </SyntaxHighlighter>
      ) : (
        children?.trimEnd()
      )}
    </code>
  );
}
