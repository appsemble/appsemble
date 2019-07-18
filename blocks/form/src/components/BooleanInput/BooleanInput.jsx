import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

/**
 * An input element for a boolean value.
 */
export default class BooleanInput extends React.Component {
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
    value: PropTypes.bool,
  };

  static defaultProps = {
    error: null,
    value: false,
  };

  render() {
    const { error, field, onChange, value } = this.props;
    const elementProps = {
      className: classNames({ 'is-danger': error }),
      id: field.name,
      name: field.name,
      onChange: event => {
        onChange({ target: { name: field.name } }, event.target.checked);
      },
      readOnly: field.readOnly,
      required: field.required,
      checked: Boolean(value),
      type: 'checkbox',
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
              <label className="checkbox">
                <input {...elementProps} />
                {field.labelText || field.label || field.name}
              </label>
              {error && (
                <p className={classNames('help', { 'is-danger': error })}>
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
