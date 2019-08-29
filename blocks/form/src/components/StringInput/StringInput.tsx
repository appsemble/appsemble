/** @jsx h */
import { Input } from '@appsemble/preact-components';
import { h, VNode } from 'preact';

import { InputProps } from '../../../block';
import messages from './messages';

type StringInputProps = InputProps<string>;

/**
 * An input element for a text type schema.
 */
export default function StringInput({
  error,
  field: { multiline, name, placeholder, label, readOnly, required, format },
  onInput,
  value = '',
}: StringInputProps): VNode {
  return (
    <Input
      error={error && messages.invalid}
      id={name}
      label={label || name}
      name={name}
      onInput={event => onInput(event, (event.target as HTMLInputElement).value)}
      placeholder={placeholder || label || name}
      readOnly={readOnly}
      required={required}
      type={multiline ? 'textarea' : format || 'text'}
      value={value}
    />
  );
}
