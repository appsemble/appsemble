import PropTypes from 'prop-types';
import React from 'react';

import FormField from '../FormField';
import Select from '../Select';


export default class SelectField extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    multiple: PropTypes.bool,
    value: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]).isRequired,
  };

  static defaultProps = {
    multiple: false,
  };

  render() {
    const {
      children,
      multiple,
      value,
      ...props
    } = this.props;

    return (
      <FormField {...props}>
        <Select
          multiple={multiple}
          value={value}
        >
          {children}
        </Select>
      </FormField>
    );
  }
}
