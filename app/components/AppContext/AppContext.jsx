import { Loader } from '@appsemble/react-components';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * A wrapper which fetches the app definition and makes sure it is available to its children.
 */
export default class AppContext extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    getApp: PropTypes.func.isRequired,
    initAuth: PropTypes.func.isRequired,
    location: PropTypes.shape().isRequired,
    ready: PropTypes.bool.isRequired,
  };

  async componentDidMount() {
    const { getApp, initAuth } = this.props;

    await getApp();
    await initAuth();
  }

  render() {
    const { children, location, ready } = this.props;

    if (!ready) {
      return <Loader />;
    }

    return React.Children.map(children, child =>
      React.cloneElement(child, {
        location,
      }),
    );
  }
}
