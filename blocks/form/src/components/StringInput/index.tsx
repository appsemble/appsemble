import { useBlock } from '@appsemble/preact';
import { Input } from '@appsemble/preact-components';
import { h, VNode } from 'preact';

import type { InputProps, StringField } from '../../../block';
import isRequired from '../../utils/isRequired';

type StringInputProps = InputProps<string, StringField>;

/**
 * An input element for a text type schema.
 */
export default function StringInput({
  disabled,
  error,
  field,
  onInput,
  value = '',
}: StringInputProps): VNode {
  const { utils } = useBlock();
  const { format, icon, label, multiline, name, placeholder, readOnly, requirements = [] } = field;
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

  const required = isRequired(field);

  return (
    <Input
      className="appsemble-string"
      disabled={disabled}
      error={error}
      iconLeft={icon}
      id={name}
      label={label}
      maxLength={Number.isFinite(maxLength) ? maxLength : undefined}
      minLength={Number.isFinite(minLength) ? minLength : undefined}
      name={name}
      onInput={(event) => onInput(event, (event.currentTarget as HTMLInputElement).value)}
      placeholder={utils.remap(placeholder, value) ?? utils.remap(label, value) ?? name}
      readOnly={readOnly}
      required={required}
      type={multiline ? 'textarea' : format || 'text'}
      value={value}
    />
  );
}
