import classNames from 'classnames';
import {
  type ComponentPropsWithoutRef,
  createElement,
  Fragment,
  type ReactElement,
  useMemo,
} from 'react';
import rehypeReact from 'rehype-react';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

import { CodeBlock } from '../CodeBlock/index.js';

interface MarkdownContentProps {
  /**
   * An optional classname to add to the wrapper component.
   */
  className?: string;

  /**
   * The markdown content to render.
   */
  content: string;

  /**
   * The locale of the markdown content.
   */
  lang?: string;
}

interface PreProps {
  className?: string;
  children: string;
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
