import {
  InputField,
} from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';


/**
 * An input element for a text type schema.
 */
export default class TextInput extends React.Component {
  static propTypes = {
    /**
     * The name of the property to render.
     */
    name: PropTypes.string.isRequired,
    /**
     * A callback for when the value changes.
     */
    onChange: PropTypes.func.isRequired,
    /**
     * Wether or not a value is required.
     */
    required: PropTypes.bool.isRequired,
    /**
     * The enum schema definition for which to render an input.
     */
    schema: PropTypes.shape().isRequired,
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
      name,
      onChange,
      required,
      schema,
      value,
      ...props
    } = this.props;

    return (
      <InputField
        label={schema.title || name}
        maxLength={schema.maxLength}
        name={name}
        onChange={onChange}
        placeholder={schema.title || name}
        required={required}
        readOnly={schema.readOnly}
        value={value || ''}
        {...props}
      />
    );
  }
}
