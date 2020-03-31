/** @jsx h */
import { FormattedMessage } from '@appsemble/preact';
import { Input } from '@appsemble/preact-components';
import { h, VNode } from 'preact';

import { InputProps, StringField } from '../../../block';

type StringInputProps = InputProps<string, StringField>;

/**
 * An input element for a text type schema.
 */
export default function StringInput({
  disabled,
  error,
  field: { format, label, maxLength, multiline, name, placeholder, readOnly, required },
  onInput,
  value = '',
}: StringInputProps): VNode {
  return (
    <Input
      disabled={disabled}
      error={error && <FormattedMessage id="invalid" />}
      id={name}
      label={label}
      maxLength={maxLength}
      name={name}
      onInput={(event) => onInput(event, (event.target as HTMLInputElement).value)}
      placeholder={placeholder ?? label ?? name}
      readOnly={readOnly}
      required={required}
      type={multiline ? 'textarea' : format || 'text'}
      value={value}
    />
  );
}
