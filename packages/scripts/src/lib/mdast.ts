import {
  BlockContent,
  Heading,
  Link,
  List,
  ListItem,
  PhrasingContent,
  Root,
  StaticPhrasingContent,
  Text,
} from 'mdast';
import toMarkdown from 'mdast-util-to-markdown';
import prettier from 'prettier';

/**
 * Ensure a node is valid by converting a string to a text node.
 *
 * @param value - The node or string to ensure the type for.
 * @returns The original node or a text node.
 */
function ensureNode<T>(value: T | string): T | Text {
  return typeof value === 'string' ? { type: 'text', value } : value;
}

/**
 * Convenience function for creating an mdast heading.
 *
 * @param depth - The level of the heading.
 * @param children - Child nodes to append to the heading.
 * @returns A heading node.
 */
export function createHeading(
  depth: Heading['depth'],
  children: (PhrasingContent | string)[],
): Heading {
  return { type: 'heading', depth, children: children.map((node) => ensureNode(node)) };
}

/**
 * Convenience function for creating an mdast link reference.
 *
 * @param url - The URL to link to.
 * @param children - Child nodes to append to the link reference.
 * @returns A link reference node.
 */
export function createLink(url: string, children: (StaticPhrasingContent | string)[]): Link {
  return {
    type: 'link',
    url,
    children: children.map((node) => ensureNode(node)),
  };
}

/**
 * Convenience function for creating an mdast list.
 *
 * @param children - List items to append.
 * @returns A list node.
 */
export function createList(children: ListItem[]): List {
  return { type: 'list', spread: false, children };
}

/**
 * Convenience function for creating an mdast list item.
 *
 * @param children - Child nodes to append to the list item.
 * @returns A list item node.
 */
export function createListItem(children: BlockContent[]): ListItem {
  return { type: 'listItem', spread: false, children };
}

/**
 * Convenience function for creating an mdast root.
 *
 * @param children - Child nodes to append to the root.
 * @returns A root node.
 */
export function createRoot(children: BlockContent[]): Root {
  return { type: 'root', children };
}

/**
 * Format an mdast root using Prettier.
 *
 * @param mdast - The mdast root to format.
 * @param filename - The filename to use for looking up the Prettier configuration.
 * @returns The formatted markdown.
 */
export async function dumpMarkdown(mdast: Root, filename: string): Promise<string> {
  const prettierConfig = await prettier.resolveConfig(filename, { editorconfig: true });
  return prettier.format(toMarkdown(mdast), { ...prettierConfig, parser: 'markdown' });
}
