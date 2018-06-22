import PropTypes from 'prop-types';
import React from 'react';


/**
 * A wrapper which fetches the app definition and makes sure it is available to its children.
 */
export default class AppContext extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    getApp: PropTypes.func.isRequired,
    location: PropTypes.shape().isRequired,
  };

  componentWillMount() {
    const {
      getApp,
    } = this.props;

    getApp();
  }

  render() {
    const {
      children,
      location,
    } = this.props;

    return React.Children.map(children, child => (
      React.cloneElement(child, {
        location,
      })
    ));
  }
}
