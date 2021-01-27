import { ReactElement } from 'react';

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

export function MDXCode({ children, className }: MDXCodeProps): ReactElement {
  const language = className?.replace(/^language-/, '');

  if (language === 'mermaid') {
    return <Mermaid graph={children} />;
  }

  return <CodeBlock className="mb-4" code={children.trimEnd()} language={language} />;
}
