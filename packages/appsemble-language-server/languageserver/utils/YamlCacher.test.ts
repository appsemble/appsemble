import { TextDocument } from 'vscode-languageserver-textdocument';
import { describe, expect, it } from 'vitest';

import { YamlCacher } from './YamlCacher.js';

const uri = 'file:///app-definition.yaml';

function doc(version: number, content: string): TextDocument {
  return TextDocument.create(uri, 'yaml', version, content);
}

describe('YamlCacher', () => {
  it('reuses the parsed document while the version has not advanced', () => {
    const cacher = new YamlCacher();
    const first = cacher.parseOrGetCached(doc(1, 'name: a'));

    const again = cacher.parseOrGetCached(doc(1, 'name: b'));

    expect(again.doc).toBe(first.doc);
    expect(again.counter).toBe(first.counter);
  });

  it('parses again when the document version advances', () => {
    const cacher = new YamlCacher();
    const first = cacher.parseOrGetCached(doc(1, 'name: a'));

    const next = cacher.parseOrGetCached(doc(2, 'name: b'));

    expect(next.doc).not.toBe(first.doc);
    expect(next.doc.toJS()).toStrictEqual({ name: 'b' });
  });
});
