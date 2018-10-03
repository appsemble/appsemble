import PropTypes from 'prop-types';
import React from 'react';

import {
  Textarea,
} from '../../base';
import FormField from '../FormField';


export default class TextareaField extends React.Component {
  static propTypes = {
    autoComplete: PropTypes.string,
    color: PropTypes.string,
    disabled: PropTypes.bool,
    iconLeft: PropTypes.node,
    iconRight: PropTypes.node,
    label: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.string,
    ]),
    maxLength: PropTypes.number,
    minLength: PropTypes.number,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    required: PropTypes.bool,
    TextareaProps: PropTypes.shape(),
    value: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]).isRequired,
  };

  static defaultProps = {
    autoComplete: null,
    color: null,
    disabled: false,
    iconLeft: null,
    iconRight: null,
    TextareaProps: {},
    label: null,
    maxLength: null,
    minLength: null,
    onChange: null,
    placeholder: null,
    required: false,
  };

  render() {
    const {
      autoComplete,
      color,
      disabled,
      TextareaProps,
      maxLength,
      minLength,
      name,
      onChange,
      placeholder,
      required,
      value,
      ...props
    } = this.props;

    return (
      <FormField {...props}>
        <Textarea
          autoComplete={autoComplete}
          color={color}
          disabled={disabled}
          maxLength={maxLength}
          minLength={minLength}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          value={value}
          {...TextareaProps}
        />
      </FormField>
    );
  }
}
