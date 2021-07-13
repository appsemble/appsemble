import { defaultLocale } from '@appsemble/utils';
import { ReactChild, ReactElement } from 'react';

import styles from './index.module.css';

export interface MDXWrapperProps extends Omit<typeof import('*.md'), 'default'> {
  /**
   * The content to render.
   */
  children: ReactChild;
}

/**
 * A wrapper for MDX content.
 *
 * This renders a `<main />` element.
 */
export function MDXWrapper({ children }: MDXWrapperProps): ReactElement {
  return (
    <main className={`content pl-6 ${styles.root}`} lang={defaultLocale}>
      {children}
    </main>
  );
}
