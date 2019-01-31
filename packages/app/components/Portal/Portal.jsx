import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';

/**
 * A portal which replaces the HTML content.
 *
 * If the portal is unmounted, the previous content is restored.
 *
 * This component doesn’t handle the lifecycle of receiving new props.
 */
export default class Portal extends React.Component {
  static propTypes = {
    /**
     * The child node to mount. This may only result in a single top level HTML node.
     */
    children: PropTypes.node.isRequired,
    /**
     * The HTML element to render the children into.
     */
    element: PropTypes.instanceOf(HTMLElement).isRequired,
  };

  componentDidMount() {
    const { element } = this.props;

    const fragment = document.createDocumentFragment();
    element.childNodes.forEach(::fragment.appendChild);
    this.fragment = fragment;
  }

  componentWillUnmount() {
    const { element } = this.props;

    element.appendChild(this.fragment);
  }

  render() {
    const { children, element } = this.props;

    return ReactDOM.createPortal(React.Children.only(children), element);
  }
}
