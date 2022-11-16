import { useBlock } from '@appsemble/preact';
import { InputField, TextAreaField } from '@appsemble/preact-components';
import classNames from 'classnames';
import { VNode } from 'preact';

import { InputProps, StringField } from '../../../block.js';
import { getMaxLength, getMinLength } from '../../utils/requirements.js';

type StringInputProps = InputProps<string, StringField>;

/**
 * An input element for a text type schema.
 */
export function StringInput({
  className,
  dirty,
  disabled,
  error,
  field,
  name,
  onChange,
  required,
  value,
}: StringInputProps): VNode {
  const { utils } = useBlock();
  const { format, icon, label, multiline, placeholder, readOnly, tag } = field;

  const remappedLabel = utils.remap(label, value) ?? name;
  const commonProps = {
    className: classNames('appsemble-string', className),
    disabled,
    error: dirty && error,
    icon,
    label: remappedLabel as string,
    maxLength: getMaxLength(field),
    minLength: getMinLength(field),
    name,
    onChange,
    optionalLabel: utils.formatMessage('optionalLabel'),
    placeholder: (utils.remap(placeholder, value) ?? remappedLabel) as string,
    readOnly,
    required,
    tag: utils.remap(tag, value) as string,
    value,
  };

  return multiline ? (
    <TextAreaField {...commonProps} />
  ) : (
    <InputField {...commonProps} type={format} />
  );
}
