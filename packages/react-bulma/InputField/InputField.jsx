import PropTypes from 'prop-types';
import React from 'react';

import Control from '../Control';
import Field from '../Field';
import Input from '../Input';


export default class InputField extends React.Component {
  static propTypes = {
    autoComplete: PropTypes.string,
    color: PropTypes.string,
    disabled: PropTypes.bool,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    required: PropTypes.bool,
    type: PropTypes.string,
    value: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]).isRequired,
  };

  static defaultProps = {
    autoComplete: null,
    color: null,
    disabled: false,
    onChange() {},
    required: false,
    type: null,
  };

  render() {
    const {
      autoComplete,
      color,
      disabled,
      name,
      onChange,
      required,
      type,
      value,
      ...props
    } = this.props;

    return (
      <Field {...props}>
        <Control>
          <Input
            autoComplete={autoComplete}
            color={color}
            disabled={disabled}
            name={name}
            onChange={onChange}
            required={required}
            type={type}
            value={value}
          />
        </Control>
      </Field>
    );
  }
}
