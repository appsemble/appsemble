import { readFileSync } from 'node:fs';
import { relative } from 'node:path';

import { type Element, type Parents, type Root } from 'hast';
import { fromHtmlIsomorphic } from 'hast-util-from-html-isomorphic';
import { toText } from 'hast-util-to-text';
import { type Plugin, type Transformer } from 'unified';
import { visit } from 'unist-util-visit';

import { mermaidSvgPath } from '../mermaid/assets.js';

/**
 * Find the single `code` child of a `pre` element if it is a Mermaid code block.
 *
 * Matches the detection used by `rehype-mermaid`: a `<pre>` wrapping a single `code` element whose
 * class list contains `language-mermaid`.
 *
 * @param pre The `pre` element to inspect.
 * @returns The Mermaid `code` element, or `undefined` if the `pre` is not a Mermaid block.
 */
function mermaidCode(pre: Element): Element | undefined {
  const children = pre.children.filter(
    (child) => child.type !== 'text' || child.value.trim() !== '',
  );
  if (children.length !== 1) {
    return;
  }
  const [code] = children;
  if (code.type !== 'element' || code.tagName !== 'code') {
    return;
  }
  const className = code.properties?.className;
  if (Array.isArray(className) && className.includes('language-mermaid')) {
    return code;
  }
}

const transformer: Transformer<Root> = (ast) => {
  visit(ast, 'element', (node, index, parent: Parents | undefined) => {
    if (node.tagName !== 'pre' || !parent || index == null) {
      return;
    }
    const code = mermaidCode(node);
    if (!code) {
      return;
    }

    const diagram = toText(code, { whitespace: 'pre' });
    const svgPath = mermaidSvgPath(diagram);

    let svg: string;
    try {
      svg = readFileSync(svgPath, 'utf8');
    } catch {
      throw new Error(
        `No pre-rendered Mermaid SVG found at ${relative(process.cwd(), svgPath)}.\n` +
          'The committed SVGs are out of date with the docs. Run `npm run render-mermaid` to regenerate them.',
      );
    }

    // Match the `inline-svg` output of `rehype-mermaid`: replace the `<pre>` with the parsed `<svg>`
    // element, so the produced HTML never reaches the studio `CodeBlock` component.
    const replacement = fromHtmlIsomorphic(svg, { fragment: true }).children.find(
      (child): child is Element => child.type === 'element' && child.tagName === 'svg',
    );
    if (!replacement) {
      throw new Error(`Invalid pre-rendered Mermaid SVG at ${relative(process.cwd(), svgPath)}`);
    }
    // eslint-disable-next-line no-param-reassign
    parent.children[index] = replacement;
  });
};

/**
 * A rehype plugin that replaces each Mermaid code block with its pre-rendered inline SVG.
 *
 * For every Mermaid code block it computes the content hash of the diagram, loads the SVG committed
 * by the render script, and replaces the code block with that inline `<svg>`. This reproduces the
 * `inline-svg` output of `rehype-mermaid` without launching a browser at build time. A missing SVG
 * is a hard error so committed SVGs cannot silently drift from the docs.
 */
export const rehypeMermaid: Plugin<[], Root> = () => transformer;
