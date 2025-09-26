import { type TextDocument } from 'vscode-languageserver-textdocument';
import { type Document, LineCounter, parseDocument } from 'yaml';

interface DocAndCounter {
  readonly doc: Document.Parsed;
  readonly counter: LineCounter;
}

interface CacheEntry {
  readonly version: number;
  readonly doc: Document.Parsed;
  readonly lineCounter: LineCounter;
}

export class YamlCacher {
  private documentMap = new Map<string, CacheEntry>();

  parseOrGetCached(textDocument: TextDocument): DocAndCounter {
    const { uri, version } = textDocument;
    const cached = this.documentMap.get(uri);
    if (cached && version <= cached.version) {
      return { doc: cached.doc, counter: cached.lineCounter };
    }
    const yaml = textDocument.getText();
    const lineCounter = new LineCounter();
    const doc = parseDocument(yaml, { lineCounter });
    this.documentMap.set(uri, { version, doc, lineCounter });
    return { doc, counter: lineCounter };
  }
}
