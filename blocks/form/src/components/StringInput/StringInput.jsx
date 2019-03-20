import classNames from 'classnames';
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
    const elementProps = {
      className: classNames(field.multiline ? 'textarea' : 'input', error && 'is-danger'),
      id: field.name,
      maxLength: field.maxLength,
      name: field.name,
      onChange,
      placeholder: field.placeholder || field.label || field.name,
      readOnly: field.readOnly,
      required: field.required,
      value,
    };

    return (
      <div className="field is-horizontal">
        <div className="field-label is-normal">
          <label className="label" htmlFor={field.name}>
            {field.label || field.name}
          </label>
        </div>
        <div className="field-body">
          <div className="field">
            <div className="control">
              {field.multiline ? <textarea {...elementProps} /> : <input {...elementProps} />}
              {error && (
                <p className={classNames('help', error && 'is-danger')}>
                  <FormattedMessage {...messages.invalid} />
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
