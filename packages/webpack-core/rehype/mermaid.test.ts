import { readFileSync } from 'node:fs';

import { type Element, type Root } from 'hast';
import { unified } from 'unified';
import { describe, expect, it, vi } from 'vitest';

import { rehypeMermaid } from './mermaid.js';

vi.mock('node:fs', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:fs')>();
  return { ...original, readFileSync: vi.fn(original.readFileSync) };
});

/**
 * Build a hast tree wrapping a Mermaid diagram in the pre/code structure that the MDX pipeline
 * produces for a fenced Mermaid block.
 *
 * @param diagram The Mermaid diagram source.
 * @returns A hast root containing the wrapped diagram.
 */
function mermaidTree(diagram: string): Root {
  return {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'pre',
        properties: {},
        children: [
          {
            type: 'element',
            tagName: 'code',
            properties: { className: ['language-mermaid'] },
            children: [{ type: 'text', value: diagram }],
          },
        ],
      },
    ],
  };
}

/**
 * Run the rehype plugin over a hast tree through a real unified processor.
 *
 * @param tree The hast tree to transform.
 * @returns The transformed hast tree.
 */
function run(tree: Root): Root {
  return unified().use(rehypeMermaid).runSync(tree);
}

describe('rehypeMermaid', () => {
  it('replaces a Mermaid code block with the committed inline SVG', () => {
    // This diagram is committed as packages/webpack-core/mermaid/assets/21f4087534d3a74c.svg.
    const [node] = run(mermaidTree('graph LR\ndata-loader-->table')).children;

    expect(node).toMatchObject({ type: 'element', tagName: 'svg' });
    expect((node as Element).properties.id).toBe('mermaid-0');
  });

  it('selects the SVG element when the asset has leading metadata', () => {
    vi.mocked(readFileSync).mockReturnValueOnce(
      '<?xml version="1.0"?><!-- Generated --><svg id="diagram"></svg>',
    );

    const [node] = run(mermaidTree('graph LR\ndata-loader-->table')).children;

    expect(node).toMatchObject({
      type: 'element',
      tagName: 'svg',
      properties: { id: 'diagram' },
    });
  });

  it('throws a regeneration hint when no SVG is committed for the diagram', () => {
    const tree = mermaidTree('graph TD\nthis-->diagram-has-no-committed-svg');
    expect(() => run(tree)).toThrow(/npm run render-mermaid/);
  });

  it('leaves non-Mermaid code blocks untouched', () => {
    const [node] = run({
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'pre',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'code',
              properties: { className: ['language-yaml'] },
              children: [{ type: 'text', value: 'name: test' }],
            },
          ],
        },
      ],
    }).children;
    expect(node).toMatchObject({ tagName: 'pre' });
  });
});
