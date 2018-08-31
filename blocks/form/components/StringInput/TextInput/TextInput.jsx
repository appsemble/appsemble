import {
  TextField,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './TextInput.css';


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
    value: PropTypes.string.isRequired,
  };

  render() {
    const {
      name,
      onChange,
      required,
      schema,
      value,
    } = this.props;

    return (
      <TextField
        fullWidth
        helperText={(
          <React.Fragment>
            {schema.maxLength == null || (
              <span className={styles.count}>
                {`${value.length}/${schema.maxLength}`}
              </span>
            )}
          </React.Fragment>
        )}
        inputProps={{
          maxLength: schema.maxLength,
        }}
        label={schema.title}
        name={name}
        onChange={onChange}
        required={required}
        value={value}
      />
    );
  }
}
