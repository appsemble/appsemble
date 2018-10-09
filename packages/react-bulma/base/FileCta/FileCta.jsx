import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

export default class FileCta extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    component: PropTypes.string,
  };

  static defaultProps = {
    className: null,
    component: 'span',
  };

  render() {
    const { className, component: Component, ...props } = this.props;

    return <Component className={classNames('file-cta', className)} {...props} />;
  }
}
