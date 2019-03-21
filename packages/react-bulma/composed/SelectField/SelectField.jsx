import PropTypes from 'prop-types';
import React from 'react';

import FormField from '../FormField';
import Select from '../Select';

export default class SelectField extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    disabled: PropTypes.bool,
    multiple: PropTypes.bool,
    name: PropTypes.string,
    onChange: PropTypes.func,
    select: PropTypes.node,
    SelectProps: PropTypes.shape(),
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  };

  static defaultProps = {
    disabled: false,
    multiple: false,
    name: null,
    onChange: null,
    select: null,
    SelectProps: {},
    value: null,
  };

  render() {
    const {
      children,
      disabled,
      multiple,
      name,
      onChange,
      select,
      SelectProps,
      value,
      ...props
    } = this.props;

    return (
      <FormField {...props}>
        <Select
          disabled={disabled}
          multiple={multiple}
          name={name}
          onChange={onChange}
          select={select}
          value={value}
          {...SelectProps}
        >
          {children}
        </Select>
      </FormField>
    );
  }
}
