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
              <input
                className={classNames('input', { 'is-danger': error })}
                id={field.name}
                max={field.max}
                min={field.min}
                name={field.name}
                onChange={event => {
                  onChange(
                    event,
                    field.type === 'integer'
                      ? Math.floor(event.target.valueAsNumber)
                      : event.target.valueAsNumber,
                  );
                }}
                placeholder={field.placeholder}
                readOnly={field.readOnly}
                required={field.required}
                step={field.step || field.type === 'integer' ? 1 : 'any'}
                type="number"
                value={value}
              />
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
