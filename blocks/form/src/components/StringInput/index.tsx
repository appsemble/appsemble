import { useBlock } from '@appsemble/preact';
import { InputField, TextAreaField } from '@appsemble/preact-components';
import { h, VNode } from 'preact';

import { InputProps, StringField } from '../../../block';
import { getMaxLength, getMinLength, isRequired } from '../../utils/requirements';

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
  const { format, icon, label, multiline, placeholder, readOnly, tag } = field;

  const remappedLabel = utils.remap(label, value) ?? name;
  const commonProps = {
    className: 'appsemble-string',
    disabled,
    error: dirty && error,
    iconLeft: icon,
    label: remappedLabel,
    maxLength: getMaxLength(field),
    minLength: getMinLength(field),
    name,
    onChange,
    optionalLabel: utils.remap(optionalLabel, value),
    placeholder: utils.remap(placeholder, value) ?? remappedLabel,
    readOnly,
    required: isRequired(field),
    tag: utils.remap(tag, value),
    value,
  };

  return multiline ? (
    <TextAreaField {...commonProps} />
  ) : (
    <InputField {...commonProps} type={format} />
  );
}
