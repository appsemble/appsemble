import { useMeta } from '@appsemble/react-components';
import { ComponentPropsWithoutRef, ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';

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

  const { page } = props;

  return (
    <Routes>
      <Route
        element={<BlockList {...props} />}
        path={String((page.parameters || []).map((param) => `/:${param}`))}
      />
    </Routes>
  );
}
