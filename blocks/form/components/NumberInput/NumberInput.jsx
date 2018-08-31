import {
  TextField,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './NumberInput.css';


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

    const inputProps = {};
    if (Number.isFinite(schema.multipleOf)) {
      inputProps.step = schema.multipleOf;
    }
    const max = [schema.maximum, schema.exclusiveMaximum].filter(Number.isFinite);
    if (max.length !== 0) {
      inputProps.max = Math.min(...max);
    }
    const min = [schema.minimum, schema.exclusiveMinimum].filter(Number.isFinite);
    if (min.length !== 0) {
      inputProps.min = Math.max(...min);
    }

    return (
      <TextField
        className={styles.root}
        fullWidth
        inputProps={inputProps}
        label={schema.title}
        name={name}
        onChange={onChange}
        required={required}
        type="number"
        value={value}
      />
    );
  }
}
