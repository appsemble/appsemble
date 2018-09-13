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
    onChange: PropTypes.func,
    value: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]).isRequired,
  };

  static defaultProps = {
    className: null,
    component: 'div',
    onChange: null,
    multiple: false,
  };

  render() {
    const {
      children,
      className,
      component: Component,
      multiple,
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
        <select multiple={multiple} onChange={onChange}>
          {children}
        </select>
      </Component>
    );
  }
}
