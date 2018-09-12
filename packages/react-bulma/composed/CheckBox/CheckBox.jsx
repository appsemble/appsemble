import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';


export default class CheckBox extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    component: PropTypes.string,
    disabled: PropTypes.bool,
    label: PropTypes.string,
    name: PropTypes.string,
    onChange: PropTypes.func,
    value: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    className: null,
    component: 'label',
    disabled: false,
    label: null,
    name: null,
    onChange: null,
  };

  render() {
    const {
      children,
      className,
      component: Component,
      disabled,
      label,
      name,
      onChange,
      value,
      ...props
    } = this.props;

    return (
      <Component
        className={classNames(
          'checkbox',
          className,
        )}
        disabled={disabled}
        {...props}
      >
        <input
          checked={value}
          className="checkbox"
          disabled={disabled}
          name={name}
          onChange={onChange}
        />
        {label}
      </Component>
    );
  }
}
