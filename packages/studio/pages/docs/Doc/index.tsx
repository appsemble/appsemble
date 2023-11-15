import { useMeta } from '@appsemble/react-components';
import { type ComponentType, type ReactNode } from 'react';

interface DocProps {
  /**
   * The MDX component to render.
   */
  readonly component: ComponentType;

  /**
   * The title to display.
   */
  readonly title: string;
}

/**
 * Render documentation in with a breadcrumb.
 */
export function Doc({ component: Component, title }: DocProps): ReactNode {
  useMeta(title);

  return <Component />;
}
