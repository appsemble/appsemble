import { defaultLocale } from '@appsemble/utils';
import { ReactElement } from 'react';

import styles from './index.module.css';

// eslint-disable-next-line import/no-unresolved
import { MDXWrapperProps } from '*.md';

/**
 * A wrapper for MDX content.
 *
 * This renders a `<main />` element.
 */
export function MDXWrapper({ children, main = true }: MDXWrapperProps): ReactElement {
  return main ? (
    <main className={`content pl-6 ${styles.root}`} lang={defaultLocale}>
      {children}
    </main>
  ) : (
    (children as ReactElement)
  );
}
