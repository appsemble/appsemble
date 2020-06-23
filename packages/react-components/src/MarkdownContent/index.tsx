import classNames from 'classnames';
import marked from 'marked';
import React from 'react';

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
   * If true, sanitize the HTML output.
   */
  sanitize?: boolean;
}

/**
 * Render a Markdown document as HTML.
 */
export default function MarkdownContent({
  className,
  content,
  sanitize = true,
}: MarkdownContentProps): React.ReactElement {
  return content ? (
    <span
      className={classNames('content', className)}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: marked(content, { sanitize }) }}
    />
  ) : null;
}
