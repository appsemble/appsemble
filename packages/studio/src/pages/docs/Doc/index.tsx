import { useMeta } from '@appsemble/react-components';
import { ComponentType, ReactElement } from 'react';

import { MDXAnchor, MDXPre } from '../../../components/MDX';

const components = {
  pre: MDXPre,
  a: MDXAnchor,
};

interface DocProps {
  /**
   * The MDX component to render.
   */
  component: ComponentType<any>;

  /**
   * The title to display.
   */
  title: string;
}

/**
 * Render documentation in with a breadcrumb.
 */
export function Doc({ component: Component, title }: DocProps): ReactElement {
  useMeta(title);

  return <Component components={components} />;
}
