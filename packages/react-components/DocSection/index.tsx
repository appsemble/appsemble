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

import { MenuItem } from '../MenuItem/index.js';

interface DocSectionProps {
  children: ReactNode;
}

interface CollapsedContextInterface {
  collapsed?: boolean;
  setCollapsed?: Dispatch<SetStateAction<boolean>>;
  collapsible: boolean;
}

export const CollapsedContext = createContext<CollapsedContextInterface>({
  collapsed: false,
  setCollapsed() {
    // Do nothing
  },
  collapsible: false,
});

export function DocSection({ children }: DocSectionProps): ReactElement {
  const [collapsed, setCollapsed] = useState(false);
  // Checks if there are any sub-sections
  const collapsible = useMemo(() => Boolean(Children.toArray(children)[1]), [children]);

  const collapseContext = useMemo(
    () => ({ collapsed, setCollapsed, collapsible }),
    [collapsed, collapsible],
  );

  return (
    <>
      {Children.map(children, (child, index) => {
        if (!isValidElement(child) || (index !== 0 && collapsed)) {
          return false;
        }
        if (index === 0 && child.type === MenuItem) {
          return (
            <CollapsedContext.Provider value={collapseContext}>{child}</CollapsedContext.Provider>
          );
        }
        return child;
      })}
    </>
  );
}
