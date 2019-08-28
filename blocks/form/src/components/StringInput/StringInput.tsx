/** @jsx h */
import classNames from 'classnames';
import { h, VNode } from 'preact';

import { InputProps } from '../../../block';
import messages from './messages';

type StringInputProps = InputProps<string>;

/**
 * An input element for a text type schema.
 */
export default function StringInput({
  error,
  field,
  onChange,
  value = '',
}: StringInputProps): VNode {
  const elementProps = {
    className: classNames(field.multiline ? 'textarea' : 'input', { 'is-danger': error }),
    id: field.name,
    name: field.name,
    onChange(event: Event) {
      onChange(event, (event.target as HTMLInputElement).value);
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
              <p className={classNames('help', { 'is-danger': error })}>{messages.invalid}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
