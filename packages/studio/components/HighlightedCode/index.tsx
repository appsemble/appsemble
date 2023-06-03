import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import { type ReactElement, useEffect, useRef } from 'react';

const languageConfigurationJSON: monaco.languages.LanguageConfiguration = {
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

const tokensProviderJSON: monaco.languages.IMonarchLanguage = {
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

const languageConfigurationHTTP: monaco.languages.LanguageConfiguration = {
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

const tokensProviderHTTP: monaco.languages.IMonarchLanguage = {
  tokenizer: {
    root: [
      [/--(.*)$/, 'http-comment'],
      [/HTTP\s*\/(.*)$/, 'http'],
      [/^[^\s:]+(?=:)/, 'http-header'],
      [/"[^\n\r"]*"/, 'http-body'],
      [/^(POST|GET|PUT|DELETE|PATCH)\s+(\S+)/, 'http-method'],
      [/({[^{}]+})/, 'http-keyword'],
      [/:(?:(?![":;[\]{}]).)*(?=\s*($|[:;[\]{}]))/, 'http-value'],
      [/(?<=\s*)[^\s!&,.:;=]+(?=[\s!&,.:;]|$)/, 'http-value'],
      [/\b[\w-]+(?=\s*=)/, 'http-key'],
      [/{|}|\[|]|;|:,|=|&/, 'delimiter'],
      [/./, 'default'],
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

    { token: 'http', foreground: '#000000' },
    { token: 'http-method', foreground: '#800080', fontStyle: 'bold' },
    { token: 'http-header', foreground: '#800080', fontStyle: 'bold' },
    { token: 'http-value', foreground: '#C18945' },
    { token: 'http-comment', foreground: '#808080', fontStyle: 'italic' },
    { token: 'http-body', foreground: '#45A245' },
    { token: 'http-key', foreground: '#991861' },
    { token: 'delimiter', foreground: '808080' },
    { token: 'default', foreground: '#808080' },
    { token: 'http-keyword', foreground: '#CC5500' },
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
        const languageName = `custom-${language}`;
        const isCustomThemeAdded = MonacoEditor.languages
          .getLanguages()
          .some((lang) => lang.id === languageName);
        if (!isLanguageSupported && !isCustomThemeAdded) {
          let tokensProvider = null;
          let languageConfiguration = null;
          switch (language) {
            case 'json':
              tokensProvider = tokensProviderJSON;
              languageConfiguration = languageConfigurationJSON;
              break;
            case 'http':
              tokensProvider = tokensProviderHTTP;
              languageConfiguration = languageConfigurationHTTP;
              break;
            default:
              tokensProvider = tokensProviderJSON;
              languageConfiguration = languageConfigurationJSON;
              break;
          }

          MonacoEditor.languages.register({ id: languageName });
          MonacoEditor.languages.setMonarchTokensProvider(languageName, tokensProvider);
          MonacoEditor.languages.setLanguageConfiguration(languageName, languageConfiguration);
          MonacoEditor.editor.defineTheme('custom-theme', theme);
          MonacoEditor.editor.create(ref.current, {
            language: languageName,
            theme: languageName,
          });
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
