/** @jsx h */
import { FormattedMessage } from '@appsemble/preact';
import classNames from 'classnames';
import { h, VNode } from 'preact';

import { BooleanField, InputProps } from '../../../block';

type BooleanInputProps = InputProps<boolean, BooleanField>;

/**
 * An input element for a boolean value.
 */
export default function BooleanInput({
  error,
  field,
  onInput,
  value = false,
}: BooleanInputProps): VNode {
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
                onInput={event => {
                  onInput(event, (event.target as HTMLInputElement).checked);
                }}
                readOnly={field.readOnly}
                required={field.required}
                type="checkbox"
              />
              {field.labelText || field.label || field.name}
            </label>
            {error && (
              <p className={classNames('help', { 'is-danger': error })}>
                <FormattedMessage id="invalid" />
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
