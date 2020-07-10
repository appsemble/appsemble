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
  className,
  disabled,
  error,
  field,
  onInput,
  value = false,
}: BooleanInputProps): VNode {
  return (
    <Checkbox
      checked={!!value}
      className={classNames(className, { 'is-danger': error })}
      disabled={disabled}
      error={error && <FormattedMessage id="invalid" />}
      help={field.labelText ?? field.label ?? null}
      id={field.name}
      label={field.label}
      name={field.name}
      onChange={onInput}
      readOnly={field.readOnly}
      required={field.required}
    />
  );
}
