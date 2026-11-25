import { TextDocument } from 'vscode-languageserver-textdocument';
import { describe, expect, it } from 'vitest';

import { languageComponentCompletions } from './languageComponentCompletion.js';

const app = `name: Test
defaultPage: Home
security:
  default:
    role: Reader
  roles:
    Reader: {}
    Editor: {}
pages:
  - name: Home
    roles:
      - Reader
      -
    blocks: []
  - name: Other
    roles: []
    blocks: []
`;

// The yaml-language-server cache keys parsed documents by URI and version, so each document gets its own URI.
function labelsAt(line: number, character: number): Promise<string[]> {
  const document = TextDocument.create('file:///roles/app-definition.yaml', 'yaml', 1, app);
  return languageComponentCompletions(document, { line, character }).then((items) =>
    items.map((item) => item.label),
  );
}

describe('languageComponentCompletions', () => {
  it('completes the roles a page does not list yet', async () => {
    // Line 12 is the empty `- ` under Home's roles.
    const labels = await labelsAt(12, 8);
    expect(labels).toContain('Editor');
    expect(labels).toContain('$guest');
    expect(labels).not.toContain('Reader');
  });

  it('completes every role for a page with an empty roles list', async () => {
    const labels = await labelsAt(15, 12);
    expect(labels).toStrictEqual(expect.arrayContaining(['Reader', 'Editor', '$guest']));
  });

  it('completes in an app that expands aliases more than a hundred times', async () => {
    const pages = Array.from(
      { length: 120 },
      (unused, index) => `  - name: Page ${index}\n    roles: [Reader]\n    blocks: *blocks\n`,
    ).join('');
    const text = `name: Test\ndefaultPage: Page 0\nsecurity:\n  default:\n    role: Reader\n  roles:\n    Reader: {}\n    Editor: {}\nx-version: &version 0.40.11\nx-blocks: &blocks [{ type: action-button, version: *version }]\npages:\n${pages}`;
    const document = TextDocument.create('file:///aliases/app-definition.yaml', 'yaml', 1, text);
    // Line 12 is `    roles: [Reader]` of the first page; character 17 is inside the brackets.
    const items = await languageComponentCompletions(document, { line: 12, character: 17 });
    expect(items.map((item) => item.label)).toContain('Editor');
  });

  it('offers no values on a key', async () => {
    // Line 15 is `    roles: []` of Other; character 6 is inside the key.
    expect(await labelsAt(15, 6)).toStrictEqual([]);
  });

  it('offers nothing where no component completes', async () => {
    expect(await labelsAt(0, 7)).toStrictEqual([]);
  });
});
