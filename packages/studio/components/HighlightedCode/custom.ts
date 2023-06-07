import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

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

const tokensProviderHTTP: monaco.languages.IMonarchLanguage = {
  tokenizer: {
    root: [
      [/--(.*)$/, 'comment'],
      [/HTTP\s*\/(.*)$/, 'http'],
      [/^[^\s:]+(?=:)/, 'http-header'],
      [/"[^\n\r"]*"/, 'http-body'],
      [/^(POST|GET|PUT|DELETE|PATCH)\s+(\S+)/, 'http-header'],
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

const tokensProviderJS: monaco.languages.IMonarchLanguage = {
  tokenizer: {
    root: [
      [/{([^{}]+)}/g, 'ref'],
      [
        /\b(if|else|while|for|do|switch|case|break|continue|return|function|var|let|const|class|new|this)\b/,
        'js-keyword',
      ],
      [
        /\b(true|false|null|undefined|NaN|Infinity|import|from| declare|module|interface)\b/,
        'js-keyword',
      ],
      [
        /\b(Math|Array|Object|String|Number|Boolean|Date|RegExp|JSON|parseInt|parseFloat|encodeURIComponent|decodeURIComponent|eval)\b/,
        'object',
      ],
      [/\.\s*([$A-Z_a-z][\w$]*)\s*(?=\()/, 'method'],
      [/\.\s*([$A-Z_a-z][\w$]*)/, 'function'],
      [/\b[$A-Z_a-z][\w$]*\b/, 'variable'],
      [/\b\d+(?:\.\d+)?\b/g, 'numbers'],
      [/\b(const|let|var)\b\s*/, 'variable-type'],
      [/'[^']*'|"[^"]*"|`[^`]*`/, 'string'],
      [/(?<!\S)[A-Z][A-Za-z]+(?=\s*\.)/, 'class'],
      [/[&(),:;=[]{}]/, 'delimiter'],
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

const tokensProviderSH: monaco.languages.IMonarchLanguage = {
  tokenizer: {
    root: [
      [/#.*$/, 'comment'],
      [/\w+(?:\/\w+)+\.\w+/m, 'path'],
      [/^\.(.+)/, 'path'],
      [/((\w*[/-]\w*)|appsemble|$)/g, 'name'],
      [/\b(install|compose|build|add|update|block|publish|create|run|up|down)\b/, 'command'],
      [/"\[A-Z_]+"/, 'string'],
      [/(yarn|npm|docker|helm)/g, 'yarn'],
      [/[A-Z_a-z]\w*/, 'name'],
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
    // Json
    { token: 'key', foreground: '#991861' },
    { token: 'property', foreground: '#659404' },
    // Http
    { token: 'http', foreground: '#6A9718' },
    { token: 'http-header', foreground: '#97186A' },
    { token: 'http-value', foreground: '#186A97' },
    { token: 'comment', foreground: '#808080', fontStyle: 'italic' },
    { token: 'http-body', foreground: '#45A245' },
    { token: 'http-key', foreground: '#991861' },
    { token: 'delimiter', foreground: '808080' },
    { token: 'default', foreground: '#808080' },
    { token: 'http-keyword', foreground: '#6A9718' },
    // JavaScript
    { token: 'variable-type', foreground: '#6A9718' },
    { token: 'js-keyword', foreground: '#6A9718' },
    { token: 'ref', foreground: '#974518' },
    { token: 'function', foreground: '#97182A' },
    { token: 'class', foreground: '#F79327' },
    { token: 'substring', foreground: '#FE6244' },
    { token: 'method', foreground: '#978518' },
    { token: 'variable', foreground: '#0451A5' },
    { token: 'string', foreground: '#451897' },
    { token: 'numbers', foreground: '#189745' },
    // Shell
    { token: 'command', foreground: '#978518' },
    { token: 'yarn', foreground: '#0451A5' },
    { token: 'name', foreground: '#008080' },
    { token: 'path', foreground: '#189745' },
    { token: 'sh-key', foreground: '#451897' },
    { token: 'sh-value', foreground: '#978518' },
  ],
};

export default class MonacoConfigure {
  language: string;

  constructor(language: string) {
    this.language = language;
  }

  getTheme(): monaco.editor.IStandaloneThemeData {
    return this.language ? theme : null;
  }

  getLanguageCongifuration(): monaco.languages.LanguageConfiguration {
    return this.language ? languageConfiguration : null;
  }

  getTokensProvider(): monaco.languages.IMonarchLanguage {
    switch (this.language) {
      case 'json':
        return tokensProviderJSON;
      case 'http':
        return tokensProviderHTTP;
      case 'js':
      case 'ts':
        return tokensProviderJS;
      case 'sh':
        return tokensProviderSH;
      default:
        return tokensProviderJSON;
    }
  }
}
