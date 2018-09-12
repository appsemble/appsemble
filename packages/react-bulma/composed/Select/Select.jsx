import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { is } from '../../utils';


export default class Select extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    component: PropTypes.string,
    multiple: PropTypes.bool,
    value: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]).isRequired,
  };

  static defaultProps = {
    className: null,
    component: 'div',
    multiple: false,
  };

  render() {
    const {
      children,
      className,
      component: Component,
      multiple,
      ...props
    } = this.props;

    return (
      <Component
        className={classNames(
          'select',
          is('multiple', multiple),
          className,
        )}
        {...props}
      >
        <select multiple={multiple}>
          {children}
        </select>
      </Component>
    );
  }
}
