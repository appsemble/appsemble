import { type ReactElement, useEffect, useRef } from 'react';

import LanguageConfiguration from './custom.js';

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
      ]).then(([MonacoEditor]) => {
        const isLanguageSupported = MonacoEditor.languages
          .getLanguages()
          .some((lang) => (lang.id === language && language !== 'json') || !language);
        const languageName = `custom-${language}`;
        const isCustomThemeAdded = MonacoEditor.languages
          .getLanguages()
          .some((lang) => lang.id === languageName);
        if (!isLanguageSupported && !isCustomThemeAdded) {
          const languageConfig = new LanguageConfiguration(language);
          const tokensProvider = languageConfig.getTokensProvider();
          const languageConfiguration = languageConfig.getLanguageConfig();
          const theme = languageConfig.getTheme();
          MonacoEditor.languages.register({ id: languageName });
          MonacoEditor.languages.setMonarchTokensProvider(languageName, tokensProvider);
          MonacoEditor.languages.setLanguageConfiguration(languageName, languageConfiguration);
          MonacoEditor.editor.defineTheme('custom-theme', theme);
        }
        MonacoEditor.editor.colorizeElement(ref.current, {
          mimeType: isLanguageSupported ? language : languageName,
          theme: 'custom-theme',
        });
      });
    }
  }, [language]);

  return (
    <code className={className} ref={ref}>
      {children?.trimEnd()}
    </code>
  );
}
