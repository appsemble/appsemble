import { useBlock } from '@appsemble/preact';
import { InputField, TextAreaField } from '@appsemble/preact-components';
import { h, VNode } from 'preact';

import type { InputProps, StringField } from '../../../block';
import { isRequired } from '../../utils/isRequired';

type StringInputProps = InputProps<string, StringField>;

/**
 * An input element for a text type schema.
 */
export function StringInput({
  dirty,
  disabled,
  error,
  field,
  name,
  onChange,
  value,
}: StringInputProps): VNode {
  const {
    parameters: { optionalLabel },
    utils,
  } = useBlock();
  const { format, icon, label, multiline, placeholder, readOnly, requirements = [], tag } = field;

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
  const commonProps = {
    className: 'appsemble-string',
    disabled,
    error: dirty && error,
    iconLeft: icon,
    label: remappedLabel,
    maxLength: Number.isFinite(maxLength) ? maxLength : undefined,
    minLength: Number.isFinite(minLength) ? minLength : undefined,
    name,
    onChange,
    optionalLabel: utils.remap(optionalLabel, value),
    placeholder: utils.remap(placeholder, value) ?? remappedLabel,
    readOnly,
    required,
    tag: utils.remap(tag, value),
    value,
  };

  return multiline ? (
    <TextAreaField {...commonProps} />
  ) : (
    <InputField {...commonProps} type={format} />
  );
}
