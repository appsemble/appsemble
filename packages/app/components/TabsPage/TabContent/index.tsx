import { type Remapper } from '@appsemble/lang-sdk';
import { useMeta } from '@appsemble/react-components';
import { type ComponentPropsWithoutRef, type ReactNode, useCallback } from 'react';

import { BlockList } from '../../BlockList/index.js';

interface TabContentProps extends ComponentPropsWithoutRef<typeof BlockList> {
  /**
   * The name of the tab.
   *
   * This will be set in the document title and used as the last breadcrumb.
   */
  readonly name: string;
}

/**
 * Render content for a single tab page.
 */
export function TabContent({ name, remap, ...props }: TabContentProps): ReactNode {
  useMeta(name);

  const remapInTab = useCallback(
    (remapper: Remapper, input: unknown, context: Record<string, any>) =>
      remap(remapper, input, { ...context, tabName: name }),
    [name, remap],
  );

  return <BlockList {...props} remap={remapInTab} subPageName={name} />;
}
