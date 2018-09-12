import {
  InputField,
} from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';


/**
 * An input element for a number type schema.
 */
export default class NumberInput extends React.Component {
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
     * The number schema definition for which to render an input.
     */
    schema: PropTypes.shape().isRequired,
    /**
     * The current value.
     */
    value: PropTypes.number,
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
    } = this.props;

    const max = [schema.maximum, schema.exclusiveMaximum].filter(Number.isFinite);
    const min = [schema.minimum, schema.exclusiveMinimum].filter(Number.isFinite);

    return (
      <InputField
        label={schema.title}
        max={max.length === 0 ? null : Math.min(...max)}
        min={min.length === 0 ? null : Math.max(...min)}
        name={name}
        onChange={onChange}
        required={required}
        step={schema.multipleOf}
        type="number"
        value={value}
      />
    );
  }
}
