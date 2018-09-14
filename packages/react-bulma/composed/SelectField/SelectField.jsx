import PropTypes from 'prop-types';
import React from 'react';

import FormField from '../FormField';
import Select from '../Select';


export default class SelectField extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    multiple: PropTypes.bool,
    name: PropTypes.string,
    value: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]).isRequired,
  };

  static defaultProps = {
    multiple: false,
    name: null,
  };

  render() {
    const {
      children,
      multiple,
      name,
      value,
      ...props
    } = this.props;

    return (
      <FormField {...props}>
        <Select
          multiple={multiple}
          name={name}
          value={value}
        >
          {children}
        </Select>
      </FormField>
    );
  }
}
