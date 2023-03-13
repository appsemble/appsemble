import { has } from '@appsemble/utils';
import { ReactElement, useEffect, useRef } from 'react';

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

const languageMap: Record<string, string> = {
  diff: null,
  http: null,
  js: 'javascript',
  ts: 'typescript',
  json: 'javascript',
  sh: 'shell',
};

/**
 * Render code using syntax highlighting based on Monaco editor.
 *
 * Don’t use this directly. Use @see CodeBlock instead.
 */
export function HighlightedCode({ children, className }: HighlightedCodeProps): ReactElement {
  const ref = useRef<HTMLPreElement>();

  const language = languageRegex.exec(className)?.[1];

  useEffect(() => {
    const aliased = has(languageMap, language) ? languageMap[language] : language;
    if (aliased) {
      Promise.all([
        import('monaco-editor/esm/vs/editor/editor.api.js'),
        import(`monaco-editor/esm/vs/basic-languages/${aliased}/${aliased}.contribution`),
      ]).then(([{ editor }]) => {
        editor.colorizeElement(ref.current, { mimeType: aliased, theme: 'vs' });
      });
    }
  }, [language]);

  return (
    <code className={className} ref={ref}>
      {children?.trimEnd()}
    </code>
  );
}
