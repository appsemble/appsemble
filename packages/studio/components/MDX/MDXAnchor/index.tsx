import { ReactElement, ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';

interface MDXAnchorProps {
  /**
   * The content of the link.
   */
  children: ReactNode;

  /**
   * The Markdown link reference that is being rendered.
   */
  href: string;
}

/**
 * Render a markdown link element.
 */
export function MDXAnchor({ children, href }: MDXAnchorProps): ReactElement {
  const { lang } = useParams<{ lang: string }>();

  if (/^https?:\/\//.test(href) || href === '/api-explorer') {
    return (
      <a href={href} rel="noopener noreferrer" target="_blank">
        {children}
      </a>
    );
  }
  return <Link to={href.startsWith('#') ? href : `/${lang}${href}`}>{children}</Link>;
}
