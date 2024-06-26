import { useBlock } from '@appsemble/preact';
import { InputField, TextAreaField } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';

import { type InputProps, type StringField } from '../../../block.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import { getMaxLength, getMinLength, isRequired } from '../../utils/requirements.js';

type StringInputProps = InputProps<string, StringField>;

/**
 * An input element for a text type schema.
 */
export function StringInput({
  className,
  dirty,
  disabled,
  error,
  errorLinkRef,
  field,
  formValues,
  name,
  onChange,
  readOnly,
}: StringInputProps): VNode {
  const { utils } = useBlock();
  const { format, help, icon, inline, label, multiline, placeholder, tag } = field;

  const value = getValueByNameSequence(name, formValues) as string;
  const remappedLabel = utils.remap(label, value) ?? name;
  const commonProps = {
    className: classNames('appsemble-string', className),
    disabled,
    error: dirty && error,
    help: utils.remap(help, value) as string,
    icon,
    label: remappedLabel as string,
    maxLength: getMaxLength(field),
    minLength: getMinLength(field),
    name,
    onChange,
    optionalLabel: utils.formatMessage('optionalLabel'),
    placeholder: (utils.remap(placeholder, value) ?? remappedLabel) as string,
    readOnly,
    required: isRequired(field, utils, formValues),
    tag: utils.remap(tag, value) as string,
    value: format === 'url' ? String(new URL(value)) : value,
    inline,
    errorLinkRef,
  };

  return multiline ? (
    <TextAreaField {...commonProps} />
  ) : (
    <InputField {...commonProps} type={format} />
  );
}
