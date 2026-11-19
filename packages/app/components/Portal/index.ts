import { type ComponentChildren, type VNode } from 'preact';
import { useEffect } from 'preact/hooks';
import { createPortal } from 'preact/compat';

interface PortalProps {
  /**
   * The child node to mount. This may only result in a single top level HTML node.
   */
  readonly children: VNode;

  /**
   * The HTML element to render the children into.
   */
  readonly element: Element;
}

/**
 * A portal which replaces the HTML content.
 *
 * If the portal is unmounted, the previous content is restored.
 *
 * This component doesn't handle the lifecycle of receiving new props.
 */
export function Portal({ children, element }: PortalProps): ComponentChildren {
  useEffect(() => {
    const copy = element ? [...element.children].slice(0, element.children.length - 1) : [];
    for (const child of copy) {
      child.classList.add('is-hidden');
    }

    return () => {
      for (const child of copy) {
        child.classList.remove('is-hidden');
      }
    };
  }, [element]);

  return element ? createPortal(children, element) : null;
}
