import {
  Children,
  createContext,
  type Dispatch,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type SetStateAction,
  useMemo,
  useState,
} from 'react';

import { MenuSection } from '../MenuSection/index.js';

interface DocSectionProps {
  children: ReactNode;
}

interface CollapsedContextInterface {
  collapsed: boolean;
  setCollapsed: Dispatch<SetStateAction<boolean>>;
}

export const CollapsedContext = createContext<CollapsedContextInterface>({
  collapsed: false,
  setCollapsed() {
    // Do nothing
  },
});

export function DocSection({ children }: DocSectionProps): ReactElement {
  const [collapsed, setCollapsed] = useState(false);
  const collapseContext = useMemo(() => ({ collapsed, setCollapsed }), [collapsed]);

  return (
    <>
      {Children.map(children, (child) => {
        if (!isValidElement(child)) {
          return;
        }
        if (child.type === MenuSection && collapsed) {
          return;
        }
        return (
          <CollapsedContext.Provider value={collapseContext}>{child}</CollapsedContext.Provider>
        );
      })}
    </>
  );
}
