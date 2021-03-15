import { ReactElement, useEffect, useRef } from 'react';

interface CodeBlockProps {
  /**
   * A class name to add to the `pre` element.
   */
  className?: string;

  /**
   * The code to render.
   */
  code: string;

  /**
   * The language to use for highlighting the code.
   */
  language: string;
}

/**
 * Render a code block using syntax highlighting based on Monaco editor.
 */
export function CodeBlock({ className, code, language }: CodeBlockProps): ReactElement {
  const ref = useRef<HTMLPreElement>();

  useEffect(() => {
    if (language) {
      import('monaco-editor').then(({ editor }) => {
        editor.colorizeElement(ref.current, { mimeType: language, theme: 'vs' });
      });
    }
  }, [language]);

  return (
    <pre className={className} ref={ref}>
      {code}
    </pre>
  );
}
