import classNames from 'classnames';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { InputProps } from '../../../block';
import messages from './messages';

type BooleanInputProps = InputProps<boolean>;

/**
 * An input element for a boolean value.
 */
export default class BooleanInput extends React.Component<BooleanInputProps> {
  static defaultProps: Partial<BooleanInputProps> = {
    error: null,
    value: false,
  };

  render(): JSX.Element {
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
              <label className="checkbox">
                <input
                  checked={!!value}
                  className={classNames({ 'is-danger': error })}
                  id={field.name}
                  name={field.name}
                  onChange={event => {
                    onChange(event, event.target.checked);
                  }}
                  readOnly={field.readOnly}
                  required={field.required}
                  type="checkbox"
                />
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
