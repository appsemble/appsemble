import PropTypes from 'prop-types';
import React from 'react';


export default class AppContext extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    getApp: PropTypes.func.isRequired,
  };

  componentWillMount() {
    this.props.getApp();
  }

  render() {
    return this.props.children;
  }
}
