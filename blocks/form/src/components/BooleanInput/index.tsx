import { FormattedMessage } from '@appsemble/preact';
import { FormComponent } from '@appsemble/preact-components/src';
import classNames from 'classnames';
import { h, VNode } from 'preact';

import type { BooleanField, InputProps } from '../../../block';

type BooleanInputProps = InputProps<boolean, BooleanField>;

/**
 * An input element for a boolean value.
 */
export default function BooleanInput({
  disabled,
  error,
  field,
  onInput,
  value = false,
}: BooleanInputProps): VNode {
  return (
    <FormComponent label={field.label} required={field.required}>
      <input
        checked={!!value}
        className={classNames('is-checkradio', { 'is-danger': error })}
        disabled={disabled}
        id={field.name}
        name={field.name}
        onInput={(event) => {
          onInput(event, (event.target as HTMLInputElement).checked);
        }}
        readOnly={field.readOnly}
        required={field.required}
        type="checkbox"
      />
      <label for={field.name}>{field.labelText ?? field.label ?? null}</label>
      {error && (
        <p className={classNames('help', { 'is-danger': error })}>
          <FormattedMessage id="invalid" />
        </p>
      )}
    </FormComponent>
  );
}
