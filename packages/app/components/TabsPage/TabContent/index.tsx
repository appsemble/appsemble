import { type Remapper } from '@appsemble/lang-sdk';
import { type ComponentProps, type VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import { BlockList } from '../../BlockList/index.js';
import { useMeta } from '../../Meta/index.js';

interface TabContentProps extends ComponentProps<typeof BlockList> {
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
export function TabContent({ name, remap, ...props }: TabContentProps): VNode {
  useMeta(name);

  const remapInTab = useCallback(
    (remapper: Remapper, input: unknown, context: Record<string, any>) =>
      remap(remapper, input, { ...context, tabName: name }),
    [name, remap],
  );

  return <BlockList {...props} remap={remapInTab} subPageName={name} />;
}
