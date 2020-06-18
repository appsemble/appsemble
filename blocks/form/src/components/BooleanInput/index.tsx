import { FormattedMessage } from '@appsemble/preact';
import { Checkbox } from '@appsemble/preact-components/src';
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
    <Checkbox
      checked={!!value}
      className={classNames({ 'is-danger': error })}
      disabled={disabled}
      error={error && <FormattedMessage id="invalid" />}
      help={field.labelText ?? field.label ?? null}
      id={field.name}
      label={field.label}
      name={field.name}
      onChange={(event) => {
        onInput(event, (event.target as HTMLInputElement).checked);
      }}
      readOnly={field.readOnly}
      required={field.required}
    />
  );
}
