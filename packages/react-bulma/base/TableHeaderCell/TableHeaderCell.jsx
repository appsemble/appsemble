import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

export default class TableHeaderCell extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    component: PropTypes.string,
  };

  static defaultProps = {
    className: null,
    component: 'th',
  };

  render() {
    const { selected, className, component: Component, ...props } = this.props;

    return <Component className={classNames(className)} {...props} />;
  }
}
