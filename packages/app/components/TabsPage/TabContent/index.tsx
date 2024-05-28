import { applyRefs, useMeta } from '@appsemble/react-components';
import { type ComponentPropsWithoutRef, type MutableRefObject, type ReactNode } from 'react';

import { BlockList } from '../../BlockList/index.js';

interface TabContentProps extends ComponentPropsWithoutRef<typeof BlockList> {
  /**
   * The name of the tab.
   *
   * This will be set in the document title.
   */
  readonly name: string;

  readonly tabRef: MutableRefObject<unknown>;
}

/**
 * Render content for a single tab page.
 */
export function TabContent({ name, tabRef, ...props }: TabContentProps): ReactNode {
  useMeta(name);

  applyRefs({ name }, tabRef);

  return <BlockList {...props} />;
}
