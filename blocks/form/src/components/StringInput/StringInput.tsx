import classNames from 'classnames';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { InputProps } from '../../../block';
import messages from './messages';

type StringInputProps = InputProps<string, HTMLInputElement | HTMLTextAreaElement>;

/**
 * An input element for a text type schema.
 */
export default class StringInput extends React.Component<StringInputProps> {
  static defaultProps: Partial<StringInputProps> = {
    error: null,
    value: '',
  };

  render(): JSX.Element {
    const { error, field, onChange, value } = this.props;
    const elementProps = {
      className: classNames(field.multiline ? 'textarea' : 'input', { 'is-danger': error }),
      id: field.name,
      name: field.name,
      onChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        onChange(event, event.target.value);
      },
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
              {field.multiline ? (
                <textarea {...elementProps} />
              ) : (
                <input {...elementProps} maxLength={field.maxLength} />
              )}
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
