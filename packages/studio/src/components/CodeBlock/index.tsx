import { has } from '@appsemble/utils';
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

const languageMap: Record<string, string> = {
  diff: null,
  http: null,
  js: 'javascript',
  json: 'javascript',
  sh: 'shell',
};

/**
 * Render a code block using syntax highlighting based on Monaco editor.
 */
export function CodeBlock({ className, code, language }: CodeBlockProps): ReactElement {
  const ref = useRef<HTMLPreElement>();

  useEffect(() => {
    const aliased = has(languageMap, language) ? languageMap[language] : language;
    if (aliased) {
      Promise.all([
        import('monaco-editor/esm/vs/editor/editor.api'),
        import(`monaco-editor/esm/vs/basic-languages/${aliased}/${aliased}.contribution`),
      ]).then(([{ editor }]) => {
        editor.colorizeElement(ref.current, { mimeType: aliased, theme: 'vs' });
      });
    }
  }, [language]);

  return (
    <pre className={className} ref={ref}>
      {code}
    </pre>
  );
}
