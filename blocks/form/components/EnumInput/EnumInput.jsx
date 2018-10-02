import {
  SelectField,
} from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';


/**
 * Render a select box which offers choices a JSON schema enum.
 */
export default class EnumInput extends React.Component {
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
      field,
      onChange,
      value,
    } = this.props;

    return (
      <SelectField
        label={field.label || field.name}
        name={field.name}
        onChange={onChange}
        value={value}
      >
        {field.enum.map(choice => (
          <option key={choice.value} value={choice.value}>
            {choice.label || choice.value}
          </option>
        ))}
      </SelectField>
    );
  }
}
