import { readFile } from 'node:fs/promises';

import { type Text } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toMarkdown } from 'mdast-util-to-markdown';
import { visit } from 'unist-util-visit';

/**
 * Get the release notes for the latest release.
 *
 * @returns The release notes for the last version
 */
export async function getReleaseNotes(): Promise<string> {
  const changelog = await readFile('CHANGELOG.md', 'utf8');
  const ast = fromMarkdown(changelog);
  let sectionStart: number | undefined;
  let sectionEnd: number | undefined;
  for (const [index, child] of ast.children.entries()) {
    if (child.type !== 'heading' || child.depth !== 2) {
      continue;
    }
    if (sectionStart) {
      sectionEnd = index;
      break;
    } else {
      sectionStart = index;
    }
  }
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  ast.children.splice(sectionEnd);
  // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
  ast.children.splice(0, sectionStart + 1);
  visit(ast, 'text', (node: Text) => {
    // eslint-disable-next-line no-param-reassign
    node.value = node.value.replaceAll(/\n+/g, (match) => (match.length === 1 ? ' ' : '\n\n'));
  });
  return toMarkdown(ast, { bullet: '-', listItemIndent: 'one', strong: '_' });
}
