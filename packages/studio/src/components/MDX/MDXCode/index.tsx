import { ReactElement } from 'react';

import { CodeBlock } from '../../CodeBlock';

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

  return <CodeBlock className="mb-4" code={children.trimEnd()} language={language} />;
}
