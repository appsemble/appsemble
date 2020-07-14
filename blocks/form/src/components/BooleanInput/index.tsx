import { FormattedMessage } from '@appsemble/preact';
import { Checkbox } from '@appsemble/preact-components/src';
import classNames from 'classnames';
import { h, VNode } from 'preact';

import type { BooleanField, InputProps } from '../../../block';
import isRequired from '../../utils/isRequired';

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
  const { label, labelText, name, readOnly } = field;
  const required = isRequired(field);

  return (
    <Checkbox
      checked={!!value}
      className={classNames('appsemble-boolean', { 'is-danger': error })}
      disabled={disabled}
      error={error && <FormattedMessage id="invalid" />}
      help={labelText ?? label ?? null}
      id={name}
      label={label}
      name={name}
      onChange={onInput}
      readOnly={readOnly}
      required={required}
    />
  );
}
