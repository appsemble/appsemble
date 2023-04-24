import { defaultLocale } from '@appsemble/utils';
import { type MDXProps } from 'mdx/types.js';
import { type ReactElement } from 'react';

import styles from './index.module.css';

/**
 * A wrapper for MDX content.
 *
 * This renders a `<main />` element.
 */
export function MDXWrapper({ children, main = true }: MDXProps): ReactElement {
  return main ? (
    <main className={`content pl-6 ${styles.root}`} lang={defaultLocale}>
      {children as ReactElement}
    </main>
  ) : (
    (children as ReactElement)
  );
}
