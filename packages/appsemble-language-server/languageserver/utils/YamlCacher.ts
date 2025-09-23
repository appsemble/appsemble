import { type TextDocument } from 'vscode-languageserver-textdocument';
import { type Document, LineCounter, parseDocument } from 'yaml';

interface DocAndCounter {
  doc: Document.Parsed;
  counter: LineCounter;
}

export class YamlCacher {
  private lastVersion = 0;

  private cachedDoc?: Document.Parsed;

  private lineCounter?: LineCounter;

  parseOrGetCached(textDocument: TextDocument): DocAndCounter {
    const { version } = textDocument;
    if (version <= this.lastVersion && this.cachedDoc) {
      return { doc: this.cachedDoc, counter: this.lineCounter! };
    }
    this.lastVersion = version;
    const yaml = textDocument.getText();
    this.lineCounter = new LineCounter();
    this.cachedDoc = parseDocument(yaml, { lineCounter: this.lineCounter });
    return { doc: this.cachedDoc, counter: this.lineCounter };
  }
}
