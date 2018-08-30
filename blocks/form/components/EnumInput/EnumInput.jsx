import {
  TextField,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';


/**
 * Render a select box which offers choices a JSON schema enum.
 */
export default class EnumInput extends React.Component {
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
    value: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]),
  };

  static defaultProps = {
    value: null,
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
        label={schema.title}
        name={name}
        onChange={onChange}
        required={required}
        select
        SelectProps={{
          native: true,
        }}
        value={value == null ? schema.enum[0] : value}
      >
        {schema.enum.map(choice => (
          <option key={choice} value={choice}>
            {`${choice}`}
          </option>
        ))}
      </TextField>
    );
  }
}
