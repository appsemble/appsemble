import classNames from 'classnames';
import {
  type ComponentPropsWithoutRef,
  createElement,
  Fragment,
  type ReactElement,
  useMemo,
} from 'react';
import rehypeReact from 'rehype-react';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

import { CodeBlock } from '../CodeBlock/index.js';

interface MarkdownContentProps {
  /**
   * An optional classname to add to the wrapper component.
   */
  readonly className?: string;

  /**
   * The markdown content to render.
   */
  readonly content: string;

  /**
   * The locale of the markdown content.
   */
  readonly lang?: string;
}

interface PreProps {
  readonly className?: string;
  readonly children: string;
}

function Pre(props: PreProps): ReactElement {
  return <CodeBlock {...props} copy />;
}

function Anchor({ children, ...props }: ComponentPropsWithoutRef<'a'>): ReactElement {
  return (
    <a {...props} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  );
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize)
  .use(rehypeSanitize, {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      code: [
        ...(defaultSchema.attributes.code || []),
        // List of all allowed languages:
        ['className', /^language-.+/],
      ],
    },
  })
  .use(rehypeReact, { createElement, Fragment, components: { a: Anchor, pre: Pre } });

/**
 * Render a Markdown document as HTML.
 */
export function MarkdownContent({ className, content, lang }: MarkdownContentProps): ReactElement {
  const node = useMemo(() => processor.processSync(content).result, [content]);

  return content ? (
    <div className={classNames('content', className)} lang={lang}>
      {node}
    </div>
  ) : null;
}
