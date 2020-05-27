import classNames from 'classnames';
import marked from 'marked';
import React from 'react';

interface MarkdownContentProps {
  className?: string;
  content: string;
  sanitize?: boolean;
}

export default function MarkdownContent({
  className,
  content,
  sanitize = true,
}: MarkdownContentProps): React.ReactElement {
  return content ? (
    <div
      className={classNames('content', className)}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: marked(content, { sanitize }) }}
    />
  ) : null;
}
