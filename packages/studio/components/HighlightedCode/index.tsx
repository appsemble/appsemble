import { ReactElement, useEffect, useState } from 'react';

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
  const [html, setHtml] = useState<string>();

  const language = languageRegex.exec(className)?.[1];

  useEffect(() => {
    if (language) {
      Promise.all([
        import('monaco-editor/esm/vs/editor/editor.api.js'),
        // @ts-expect-error This module does exist.
        import('monaco-editor/esm/vs/basic-languages/monaco.contribution.js'),
      ]).then(async ([{ editor, languages }]) => {
        const detected = languages
          .getLanguages()
          .find(
            (lang) =>
              lang.id === language ||
              lang.aliases?.includes(language) ||
              lang.extensions?.includes(`.${language}`) ||
              lang.mimetypes?.includes(language),
          );
        if (detected) {
          const highlighted = await editor.colorize(children.trimEnd(), detected.id, {});
          setHtml(highlighted);
        }
      });
    }
  }, [children, language]);

  if (html) {
    return <code className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return <code className={className}>{children?.trimEnd()}</code>;
}
