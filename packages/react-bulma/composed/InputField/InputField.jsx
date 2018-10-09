import PropTypes from 'prop-types';
import React from 'react';

import { Input } from '../../base';
import FormField from '../FormField';

export default class InputField extends React.Component {
  static propTypes = {
    autoComplete: PropTypes.string,
    color: PropTypes.string,
    disabled: PropTypes.bool,
    iconLeft: PropTypes.node,
    iconRight: PropTypes.node,
    InputProps: PropTypes.shape(),
    label: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
    max: PropTypes.number,
    maxLength: PropTypes.number,
    min: PropTypes.number,
    minLength: PropTypes.number,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    required: PropTypes.bool,
    step: PropTypes.number,
    type: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  };

  static defaultProps = {
    autoComplete: null,
    color: null,
    disabled: false,
    iconLeft: null,
    iconRight: null,
    InputProps: {},
    label: null,
    max: null,
    maxLength: null,
    min: null,
    minLength: null,
    onChange: null,
    placeholder: null,
    required: false,
    step: null,
    type: null,
  };

  render() {
    const {
      autoComplete,
      color,
      disabled,
      InputProps,
      max,
      maxLength,
      min,
      minLength,
      name,
      onChange,
      placeholder,
      required,
      step,
      type,
      value,
      ...props
    } = this.props;

    return (
      <FormField color={color} {...props}>
        <Input
          autoComplete={autoComplete}
          color={color}
          disabled={disabled}
          max={max}
          maxLength={maxLength}
          min={min}
          minLength={minLength}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          step={step}
          type={type}
          value={value}
          {...InputProps}
        />
      </FormField>
    );
  }
}
