import {
  type ComponentChildren,
  createContext,
  isValidElement,
  toChildArray,
  type VNode,
} from 'preact';
import { type Dispatch, type StateUpdater, useMemo, useState } from 'preact/hooks';

import { MenuItem } from '../MenuItem/index.js';

interface CollapsibleMenuSectionProps {
  readonly children: ComponentChildren;
}

interface CollapsedContextInterface {
  collapsed?: boolean;
  setCollapsed?: Dispatch<StateUpdater<boolean>>;
  collapsible: boolean;
}

export const CollapsedContext = createContext<CollapsedContextInterface>({
  collapsed: false,
  setCollapsed() {
    // Do nothing
  },
  collapsible: false,
});

export function CollapsibleMenuSection({ children }: CollapsibleMenuSectionProps): VNode {
  const [collapsed, setCollapsed] = useState(false);
  // Checks if there are any sub-sections
  const collapsible = useMemo(() => Boolean(toChildArray(children)[1]), [children]);

  const collapseContext = useMemo(
    () => ({ collapsed, setCollapsed, collapsible }),
    [collapsed, collapsible],
  );

  return (
    <>
      {toChildArray(children).map((child, index) => {
        if (!isValidElement(child) || (index !== 0 && collapsed)) {
          return false;
        }
        if (index === 0 && child.type === MenuItem) {
          return (
            <CollapsedContext.Provider key={child.key} value={collapseContext}>
              {child}
            </CollapsedContext.Provider>
          );
        }
        return child;
      })}
    </>
  );
}
