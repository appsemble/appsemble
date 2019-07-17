import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

/**
 * An input element for a number type schema.
 */
export default class NumberInput extends React.Component {
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
    value: PropTypes.number,
  };

  static defaultProps = {
    error: null,
    value: undefined,
  };

  render() {
    const { error, field, onChange, value } = this.props;
    const elementProps = {
      className: classNames('input', { 'is-danger': error }),
      id: field.name,
      min: field.min,
      max: field.max,
      step: field.step || field.type === 'integer' ? '1' : 'any',
      name: field.name,
      onChange: event => {
        onChange(
          { target: { name: field.name } },
          field.type === 'integer'
            ? Number.parseInt(event.target.value, 10)
            : Number.parseFloat(event.target.value),
        );
      },
      placeholder: field.placeholder,
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
              {<input type="number" {...elementProps} />}
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
