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
  collapsable: boolean;
}

export const CollapsedContext = createContext<CollapsedContextInterface>({
  collapsed: false,
  setCollapsed() {
    // Do nothing
  },
  collapsable: false,
});

export function DocSection({ children }: DocSectionProps): ReactElement {
  const [collapsed, setCollapsed] = useState(false);
  // Checks if there are any sub-sections
  const collapsable = useMemo(() => Children.toArray(children)[1] != null, [children]);

  const collapseContext = useMemo(
    () => ({ collapsed, setCollapsed, collapsable }),
    [collapsed, collapsable],
  );

  const notCollapsableContext = useMemo(() => ({ collapsable: false }), []);

  return (
    <>
      {Children.map(children, (child, index) => {
        if (!isValidElement(child)) {
          return;
        }
        if (index === 0 && child.type === MenuItem) {
          return (
            <CollapsedContext.Provider value={collapseContext}>{child}</CollapsedContext.Provider>
          );
        }
        if (collapsed) {
          return;
        }
        return (
          <CollapsedContext.Provider value={notCollapsableContext}>
            {child}
          </CollapsedContext.Provider>
        );
      })}
    </>
  );
}
