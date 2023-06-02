import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import { type ReactElement, useEffect, useRef } from 'react';

const languageConfiguration: monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/'],
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
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

const tokensProvider: monaco.languages.IMonarchLanguage = {
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

const theme: monaco.editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  colors: {},
  rules: [
    { token: 'key', foreground: '#991861' },
    { token: 'property', foreground: '#659404' },
  ],
};

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
        const isCustomThemeAdded = MonacoEditor.languages
          .getLanguages()
          .some((lang) => lang.id === 'custom');
        if (!isLanguageSupported && !isCustomThemeAdded) {
          MonacoEditor.languages.register({ id: 'custom' });
          MonacoEditor.languages.setMonarchTokensProvider('custom', tokensProvider);
          MonacoEditor.languages.setLanguageConfiguration('custom', languageConfiguration);
          MonacoEditor.editor.defineTheme('custom', theme);
          MonacoEditor.editor.create(ref.current, {
            language: 'custom',
            theme: 'custom',
          });
        }
        MonacoEditor.editor.colorizeElement(ref.current, {
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
