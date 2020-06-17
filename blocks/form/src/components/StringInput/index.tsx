import { FormattedMessage } from '@appsemble/preact';
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
  field: { format, icon, label, multiline, name, placeholder, readOnly, required, requirements },
  onInput,
  value = '',
}: StringInputProps): VNode {
  const requirementAttributes: { minLength?: number; maxLength?: number } = {};
  const maxLength = Math.max(
    ...requirements
      .map((requirement) => 'maxLength' in requirement && requirement.maxLength)
      .filter(Number.isFinite),
  );

  const minLength = Math.min(
    ...requirements
      .map((requirement) => 'minLength' in requirement && requirement.minLength)
      .filter(Number.isFinite),
  );

  if (Number.isFinite(maxLength)) {
    requirementAttributes.maxLength = maxLength;
  }

  if (Number.isFinite(minLength)) {
    requirementAttributes.minLength = minLength;
  }

  return (
    <Input
      disabled={disabled}
      error={error && <FormattedMessage id="invalid" />}
      iconLeft={icon}
      id={name}
      label={label}
      name={name}
      onInput={(event) => onInput(event, (event.target as HTMLInputElement).value)}
      placeholder={placeholder ?? label ?? name}
      readOnly={readOnly}
      required={required}
      type={multiline ? 'textarea' : format || 'text'}
      value={value}
      {...requirementAttributes}
    />
  );
}
