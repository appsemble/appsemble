import {
  Children,
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useState,
} from 'react';

import { MenuItem } from '../MenuItem/index.js';
import { MenuSection } from '../MenuSection/index.js';

interface DocSectionProps {
  children: ReactNode;
}

export const CollapsedContext = createContext({ collapsed: false, setCollapsed(): void {} });

export function DocSection({ children }: DocSectionProps): ReactElement {
  const [collapsed, setCollapsed] = useState(false);

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
          <CollapsedContext.Provider value={{ collapsed, setCollapsed }}>
            {child}
          </CollapsedContext.Provider>
        );
      })}
    </>
  );
}
