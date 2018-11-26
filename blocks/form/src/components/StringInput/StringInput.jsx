import { InputField, TextareaField } from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

/**
 * An input element for a text type schema.
 */
export default class StringInput extends React.Component {
  static propTypes = {
    /**
     * A field error object.
     */
    error: PropTypes.shape(),
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
    error: null,
    value: '',
  };

  render() {
    const { error, field, onChange, value } = this.props;

    const Component = field.multiline ? TextareaField : InputField;

    return (
      <Component
        color={error && 'danger'}
        help={error && <FormattedMessage {...messages.invalid} />}
        label={field.label || field.name}
        maxLength={field.maxLength}
        name={field.name}
        onChange={onChange}
        placeholder={field.placeholder || field.label || field.name}
        readOnly={field.readOnly}
        required={field.required}
        value={value}
      />
    );
  }
}
