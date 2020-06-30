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
  field: { label, labelText, name, readOnly, requirements = [] },
  onInput,
  value = false,
}: BooleanInputProps): VNode {
  const required = !!requirements?.find((req) => 'required' in req && req.required);

  return (
    <Checkbox
      checked={!!value}
      className={classNames({ 'is-danger': error })}
      disabled={disabled}
      error={error && <FormattedMessage id="invalid" />}
      help={labelText ?? label ?? null}
      id={name}
      label={label}
      name={name}
      onChange={(event) => {
        onInput(event, (event.target as HTMLInputElement).checked);
      }}
      readOnly={readOnly}
      required={required}
    />
  );
}
