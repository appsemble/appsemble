import { Input } from '@appsemble/preact-components';
import { h, VNode } from 'preact';

import type { InputProps, StringField } from '../../../block';

type StringInputProps = InputProps<string, StringField>;

/**
 * An input element for a text type schema.
 */
export default function StringInput({
  disabled,
  error,
  field: {
    format,
    icon,
    label,
    multiline,
    name,
    placeholder,
    readOnly,
    required,
    requirements = [],
  },
  onInput,
  value = '',
}: StringInputProps): VNode {
  const maxLength = Math.max(
    ...requirements
      ?.map((requirement) => 'maxLength' in requirement && requirement.maxLength)
      .filter(Number.isFinite),
  );

  const minLength = Math.min(
    ...requirements
      ?.map((requirement) => 'minLength' in requirement && requirement.minLength)
      .filter(Number.isFinite),
  );

  return (
    <Input
      disabled={disabled}
      error={error}
      iconLeft={icon}
      id={name}
      label={label}
      maxLength={Number.isFinite(maxLength) ? maxLength : undefined}
      minLength={Number.isFinite(minLength) ? minLength : undefined}
      name={name}
      onInput={(event) => onInput(event, (event.currentTarget as HTMLInputElement).value)}
      placeholder={placeholder ?? label ?? name}
      readOnly={readOnly}
      required={required}
      type={multiline ? 'textarea' : format || 'text'}
      value={value}
    />
  );
}
