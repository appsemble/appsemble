import {
  InputField,
} from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';


/**
 * An input element for a text type schema.
 */
export default class StringInput extends React.Component {
  static propTypes = {
    /**
     * The enum field to render.
     */
    field: PropTypes.shape().isRequired,
    /**
     * A callback for when the value changes.
     */
    onChange: PropTypes.func.isRequired,
    /**
     * The current value.
     */
    value: PropTypes.string,
  };

  static defaultProps = {
    value: '',
  };

  render() {
    const {
      field,
      onChange,
      value,
    } = this.props;

    return (
      <InputField
        label={field.label || field.name}
        maxLength={field.maxLength}
        name={field.name}
        onChange={onChange}
        placeholder={field.placeholder || field.name}
        required={field.required}
        readOnly={field.readOnly}
        value={value}
      />
    );
  }
}
