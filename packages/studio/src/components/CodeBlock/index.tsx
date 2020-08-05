import { editor } from 'monaco-editor';
import React, { ReactElement, useEffect, useRef } from 'react';

interface CodeBlockProps {
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
export default function CodeBlock({ code, language }: CodeBlockProps): ReactElement {
  const ref = useRef<HTMLPreElement>();

  useEffect(() => {
    if (language) {
      editor.colorizeElement(ref.current, { theme: 'vs' });
    }
  }, [language]);

  return (
    <pre ref={ref} data-lang={language}>
      {code}
    </pre>
  );
}
