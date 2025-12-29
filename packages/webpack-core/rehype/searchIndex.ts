import { valueToEstree } from 'estree-util-value-to-estree';
import { type Element, type Root, type RootContent } from 'hast';
import { toText } from 'hast-util-to-text';
import 'mdast-util-mdx';
import { type Plugin, type Transformer } from 'unified';

const transformer: Transformer<Root> = (ast) => {
  const sections: [string, { title: string; haystack: string }][] = [];
  let section: RootContent[] = [];
  let heading: Element | undefined;

  for (const child of ast.children) {
    if (child.type === 'text') {
      section.push(child);
    }

    if (child.type !== 'element') {
      continue;
    }

    if (child.properties?.id) {
      if (heading && child.properties.id) {
        sections.push([
          heading.properties.id as string,
          {
            title: toText(heading),
            // XXX: handle unexpected `mdxJsx*` tokens contained in element when updating
            // hast-util-to-text to v4.0.1 to avoid console.trace messages
            haystack: toText({ type: 'root', children: section }),
          },
        ]);
      }

      heading = child;
      section = [];
    }

    section.push(child);
  }

  if (heading && section.length) {
    sections.push([
      heading.properties.id as string,
      {
        title: toText(heading),
        haystack: toText({ type: 'root', children: section }),
      },
    ]);
  }

  ast.children.unshift({
    type: 'mdxjsEsm',
    value: '',
    data: {
      estree: {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ExportNamedDeclaration',
            attributes: [],
            specifiers: [],
            declaration: {
              type: 'VariableDeclaration',
              kind: 'const',
              declarations: [
                {
                  type: 'VariableDeclarator',
                  id: { type: 'Identifier', name: 'searchIndex' },
                  init: valueToEstree(sections),
                },
              ],
            },
          },
        ],
      },
    },
  });
};

export const rehypeSearchIndex: Plugin<[], Root> = () => transformer;
