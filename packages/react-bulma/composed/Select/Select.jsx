import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { is } from '../../utils';

export default class Select extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    component: PropTypes.string,
    disabled: PropTypes.bool,
    multiple: PropTypes.bool,
    name: PropTypes.string,
    onChange: PropTypes.func,
    select: PropTypes.node,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  };

  static defaultProps = {
    children: null,
    className: null,
    component: 'div',
    disabled: false,
    multiple: false,
    name: null,
    onChange: null,
    select: null,
    value: '',
  };

  render() {
    const {
      children,
      className,
      component: Component,
      disabled,
      multiple,
      name,
      onChange,
      select,
      value,
      ...props
    } = this.props;

    return (
      <Component className={classNames('select', is('multiple', multiple), className)} {...props}>
        {select || (
          <select
            disabled={disabled}
            multiple={multiple}
            name={name}
            onChange={onChange}
            value={value}
          >
            {children}
          </select>
        )}
      </Component>
    );
  }
}
