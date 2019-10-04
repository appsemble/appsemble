import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

interface PortalProps {
  /**
   * The child node to mount. This may only result in a single top level HTML node.
   */
  children: React.ReactChild;

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
export default function Portal({ element, children }: PortalProps): React.ReactElement {
  useEffect(() => {
    const fragment = document.createDocumentFragment();
    element.childNodes.forEach(child => fragment.appendChild(child));

    // Cleanup function
    return () => {
      element.appendChild(fragment);
    };
  }, [element]);

  return ReactDOM.createPortal(React.Children.only(children), element);
}
