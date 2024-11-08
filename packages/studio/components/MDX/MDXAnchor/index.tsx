import { type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';

interface MDXAnchorProps {
  /**
   * The content of the link.
   */
  readonly children: ReactNode;

  /**
   * The Markdown link reference that is being rendered.
   */
  readonly href: string;
}

/**
 * Render a markdown link element.
 */
export function MDXAnchor({ children, href }: MDXAnchorProps): ReactNode {
  const { lang } = useParams<{ lang: string }>();

  if (/^https?:\/\//.test(href) || href === '/api-explorer') {
    return (
      <a href={href} rel="noopener noreferrer" target="_blank">
        {children}
      </a>
    );
  }
  return (
    <Link
      to={
        href
          ? href.startsWith('#')
            ? href
            : `/${lang}${href.replace('/packages/studio/pages', '')}`
          : '#'
      }
    >
      {children}
    </Link>
  );
}
