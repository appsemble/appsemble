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
import { MenuSection } from '../MenuSection/index.js';

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

function checkForEmptySection(child: ReactNode): boolean {
  if (!isValidElement(child)) {
    return false;
  }

  if (child.props.children <= 0) {
    return false;
  }

  return true;
}

export function DocSection({ children }: DocSectionProps): ReactElement {
  const [collapsed, setCollapsed] = useState(false);
  const [collapsable, setCollapsable] = useState(
    checkForEmptySection(Children.toArray(children)[2]),
  );

  const collapseContext = useMemo(
    () => ({ collapsed, setCollapsed, collapsable }),
    [collapsed, collapsable],
  );

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
        return (
          <CollapsedContext.Provider value={{ ...collapseContext, collapsable: false }}>
            {child}
          </CollapsedContext.Provider>
        );
      })}
    </>
  );
}
