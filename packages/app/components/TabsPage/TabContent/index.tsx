import { useMeta } from '@appsemble/react-components';
import { type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { BlockList } from '../../BlockList/index.js';

interface TabContentProps extends ComponentPropsWithoutRef<typeof BlockList> {
  /**
   * The name of the tab.
   *
   * This will be set in the document title.
   */
  readonly name: string;
}

/**
 * Render content for a single tab page.
 */
export function TabContent({ name, ...props }: TabContentProps): ReactNode {
  useMeta(name);

  return <BlockList {...props} />;
}
