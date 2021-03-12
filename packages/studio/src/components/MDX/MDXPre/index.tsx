import { Children, ReactElement } from 'react';

import { CodeBlock } from '../../CodeBlock';
import { Mermaid } from '../../Mermaid';

interface MDXCodeProps {
  /**
   * The code to render.
   */
  children: string;

  /**
   * The class name which includes the language code.
   */
  className: string;
}

interface MDXPreProps {
  /**
   * Each child element of a markdown code block has a single code child node.
   */
  children: ReactElement<MDXCodeProps>;
}

/**
 * Render an MDX pre element.
 *
 * This is needed to prevent MDX from rendering a nested `<pre />` element for code blocks.
 */
export function MDXPre({ children }: MDXPreProps): ReactElement {
  const {
    props: { children: code, className },
  } = Children.only(children);

  const language = className?.replace(/^language-/, '');

  if (language === 'mermaid') {
    return <Mermaid graph={code} />;
  }

  return <CodeBlock className="mb-4" code={code?.trimEnd()} language={language} />;
}
