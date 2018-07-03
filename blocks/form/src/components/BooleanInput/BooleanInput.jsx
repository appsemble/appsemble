import {
  FormControlLabel,
  Switch,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';


/**
 * An input element for a boolean type schema.
 */
export default class BooleanInput extends React.Component {
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
     * The boolean schema definition for which to render an input.
     */
    schema: PropTypes.shape().isRequired,
    /**
     * The current value.
     */
    value: PropTypes.bool,
  };

  static defaultProps = {
    value: false,
  };

  render() {
    const {
      name,
      onChange,
      schema,
      value,
    } = this.props;

    return (
      <FormControlLabel
        control={<Switch checked={value} />}
        label={schema.title}
        name={name}
        onChange={onChange}
      />
    );
  }
}
