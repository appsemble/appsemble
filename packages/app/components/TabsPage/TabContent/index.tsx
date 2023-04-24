import { useMeta } from '@appsemble/react-components';
import { type ComponentPropsWithoutRef, type ReactElement } from 'react';

import { BlockList } from '../../BlockList/index.js';

interface TabContentProps extends ComponentPropsWithoutRef<typeof BlockList> {
  /**
   * The name of the tab.
   *
   * This will be set in the document title.
   */
  name: string;
}

/**
 * Render content for a single tab page.
 */
export function TabContent({ name, ...props }: TabContentProps): ReactElement {
  useMeta(name);

  return <BlockList {...props} />;
}
