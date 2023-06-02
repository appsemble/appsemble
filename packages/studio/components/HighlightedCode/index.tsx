import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import { type ReactElement, useEffect, useRef } from 'react';

class MonacoConfiguration {
  languageConfiguration: monaco.languages.LanguageConfiguration = {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/'],
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: "'", close: "'", notIn: ['string', 'comment'] },
      { open: '"', close: '"', notIn: ['string', 'comment'] },
    ],
    surroundingPairs: [
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '{', close: '}' },
    ],
  };

  tokensProvider: monaco.languages.IMonarchLanguage = {
    tokenizer: {
      root: [
        [/{/, 'delimiter.bracket'],
        [/}/, 'delimiter.bracket'],
        [/\[/, 'delimiter.bracket'],
        [/]/, 'delimiter.bracket'],
        { include: '@whitespace' },
        { include: '@numbers' },
        [/:/, 'delimiter'],
        [/,/, 'delimiter'],
        [/("[^"]*")(\s*)(:)/, ['key', 'white', 'delimiter']],
        [/("[^"]*")(\s*)/, 'property'],
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@comment'],
      ],
      whitespace: [[/\s+/, 'white']],
      numbers: [[/-?\d+(\.\d+)?/, 'number']],
      comment: [
        [/[^*/]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[*/]/, 'comment'],
      ],
    },
  };

  theme: monaco.editor.IStandaloneThemeData = {
    base: 'vs',
    inherit: true,
    colors: {},
    rules: [
      { token: 'key', foreground: '#991861' },
      { token: 'property', foreground: '#659404' },
      { token: 'comment', foreground: '#BAA393' },
      { token: 'comment', fontStyle: 'italic' },
      { token: 'number', foreground: '#C76B29' },
      { token: 'delimiter.bracket', foreground: '#BAA393' },
    ],
  };
}

const monacoConfig = new MonacoConfiguration();

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
      ]).then(([{ editor, languages }]) => {
        const isLanguageSupported = languages
          .getLanguages()
          .some((lang) => (lang.id === language && language !== 'json') || !language);
        if (!isLanguageSupported) {
          languages.register({ id: 'custom' });
          languages.setMonarchTokensProvider('custom', monacoConfig.tokensProvider);
          languages.setLanguageConfiguration('custom', monacoConfig.languageConfiguration);
          editor.defineTheme('custom', monacoConfig.theme);
          editor.create(ref.current, {
            language: 'custom',
            theme: 'custom',
          });
        }
        editor.colorizeElement(ref.current, {
          mimeType: isLanguageSupported ? language : 'custom',
          theme: 'custom',
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
