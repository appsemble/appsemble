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
    name: PropTypes.string,
    onChange: PropTypes.func,
    value: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]),
  };

  static defaultProps = {
    className: null,
    component: 'div',
    multiple: false,
    name: null,
    onChange: null,
    value: null,
  };

  render() {
    const {
      children,
      className,
      component: Component,
      multiple,
      name,
      onChange,
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
        <select multiple={multiple} name={name} onChange={onChange}>
          {children}
        </select>
      </Component>
    );
  }
}
