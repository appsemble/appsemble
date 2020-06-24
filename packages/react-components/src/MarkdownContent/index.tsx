import classNames from 'classnames';
import marked from 'marked';
import React from 'react';
import { useLocation } from 'react-router-dom';

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
  const location = useLocation();
  return content ? (
    <span
      className={classNames('content', className)}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: marked(content, { sanitize, baseUrl: `${location.pathname}${location.search}` }),
      }}
    />
  ) : null;
}
