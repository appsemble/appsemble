import { Children, ReactChild, ReactElement, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  /**
   * The child node to mount. This may only result in a single top level HTML node.
   */
  children: ReactChild;

  /**
   * The HTML element to render the children into.
   */
  element: Element;
}

/**
 * A portal which replaces the HTML content.
 *
 * If the portal is unmounted, the previous content is restored.
 *
 * This component doesn’t handle the lifecycle of receiving new props.
 */
export function Portal({ children, element }: PortalProps): ReactElement {
  useEffect(() => {
    const fragment = document.createDocumentFragment();
    element.childNodes.forEach((child) => fragment.append(child));

    // Cleanup function
    return () => {
      element.append(fragment);
    };
  }, [element]);

  return createPortal(Children.only(children), element);
}
