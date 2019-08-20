import React from 'react';
import ReactDOM from 'react-dom';

interface PortalProps {
  /**
   * The child node to mount. This may only result in a single top level HTML node.
   */
  children: React.ReactChildren;

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
export default class Portal extends React.Component<PortalProps> {
  fragment: DocumentFragment;

  componentDidMount(): void {
    const { element } = this.props;

    const fragment = document.createDocumentFragment();
    element.childNodes.forEach(child => fragment.appendChild(child));
    this.fragment = fragment;
  }

  componentWillUnmount(): void {
    const { element } = this.props;

    element.appendChild(this.fragment);
  }

  render(): React.ReactPortal {
    const { children, element } = this.props;

    return ReactDOM.createPortal(React.Children.only(children), element);
  }
}
