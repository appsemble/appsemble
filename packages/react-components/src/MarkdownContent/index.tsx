import classNames from 'classnames';
import marked from 'marked';
import { ReactElement, useMemo } from 'react';
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
   * The locale of the markdown content.
   */
  lang?: string;

  /**
   * If true, sanitize the HTML output.
   */
  sanitize?: boolean;
}

/**
 * Render a Markdown document as HTML.
 */
export function MarkdownContent({
  className,
  content = '',
  lang,
  sanitize = true,
}: MarkdownContentProps): ReactElement {
  const location = useLocation();

  const innerHTML = useMemo(
    () => ({
      __html: marked(content, { sanitize, baseUrl: `${location.pathname}${location.search}` }),
    }),
    [content, location, sanitize],
  );

  return content ? (
    <span
      className={classNames('content', className)}
      dangerouslySetInnerHTML={innerHTML}
      lang={lang}
    />
  ) : null;
}
