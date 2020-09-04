import { useBlock } from '@appsemble/preact';
import { Input } from '@appsemble/preact-components';
import { h, VNode } from 'preact';

import type { InputProps, StringField } from '../../../block';
import { isRequired } from '../../utils/isRequired';

type StringInputProps = InputProps<string, StringField>;

/**
 * An input element for a text type schema.
 */
export function StringInput({
  disabled,
  error,
  field,
  onInput,
  value = '',
}: StringInputProps): VNode {
  const {
    parameters: { optionalLabel },
    utils,
  } = useBlock();
  const {
    format,
    icon,
    label,
    multiline,
    name,
    placeholder,
    readOnly,
    requirements = [],
    tag,
  } = field;
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
  const remappedLabel = utils.remap(label, value) ?? name;

  return (
    <Input
      className="appsemble-string"
      disabled={disabled}
      error={error}
      iconLeft={icon}
      id={name}
      label={remappedLabel}
      maxLength={Number.isFinite(maxLength) ? maxLength : undefined}
      minLength={Number.isFinite(minLength) ? minLength : undefined}
      name={name}
      onInput={(event) => onInput(event, (event.currentTarget as HTMLInputElement).value)}
      optionalLabel={utils.remap(optionalLabel, value)}
      placeholder={utils.remap(placeholder, value) ?? remappedLabel}
      readOnly={readOnly}
      required={required}
      tag={utils.remap(tag, value)}
      type={multiline ? 'textarea' : format || 'text'}
      value={value}
    />
  );
}
