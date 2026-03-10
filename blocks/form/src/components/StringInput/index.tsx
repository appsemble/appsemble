import { useBlock } from '@appsemble/preact';
import { IconButton, InputField, TextAreaField } from '@appsemble/preact-components';
import { has } from '@appsemble/utils';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { useCallback, useMemo, useState } from 'preact/hooks';

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
  fieldsetEntryValues = {},
  formValues,
  name,
  onChange,
  readOnly,
}: StringInputProps): VNode {
  const { utils } = useBlock();
  const [hidePassword, setHidePassword] = useState(true);
  const toggleHidePassword = useCallback(() => {
    setHidePassword((prevValue) => !prevValue);
  }, []);
  const {
    datalistEnabled = false,
    format,
    help,
    icon,
    inline,
    label,
    multiline,
    placeholder,
    tag,
  } = field;
  let { datalist = [] } = field;

  const unknownValue = getValueByNameSequence(name, formValues);
  let value;
  if (unknownValue instanceof Object) {
    if (!multiline && datalistEnabled && has(unknownValue, 'datalist')) {
      datalist = (unknownValue as { datalist: { value: string }[] }).datalist;
    }
    value = has(unknownValue, 'value') ? (unknownValue as { value: number | string }).value : '';
  } else {
    value = unknownValue as string;
  }

  const remapperValues = useMemo(
    () => ({ formValues, fieldsetEntryValues }),
    [formValues, fieldsetEntryValues],
  );

  const remappedLabel = utils.remap(label, value) ?? name;
  const commonProps = {
    control:
      format === 'password' ? (
        <IconButton icon={hidePassword ? 'eye-slash' : 'eye'} onClick={toggleHidePassword} />
      ) : undefined,
    className: classNames('appsemble-string', className),
    disabled,
    error: dirty && error,
    help: utils.remap(help, value) as string,
    icon,
    label: remappedLabel as string,
    maxLength: getMaxLength(field, utils, remapperValues),
    minLength: getMinLength(field, utils, remapperValues),
    name,
    onChange,
    optionalLabel: utils.formatMessage('optionalLabel'),
    placeholder: (utils.remap(placeholder, value) ?? remappedLabel) as string,
    readOnly,
    required: isRequired(field, utils, formValues),
    tag: utils.remap(tag, value) as string,
    value: format === 'url' && typeof value === 'string' ? String(new URL(value)) : value,
    inline,
    errorLinkRef,
  };

  return multiline ? (
    <TextAreaField {...commonProps} />
  ) : datalistEnabled && datalist.length > 0 ? (
    <>
      <datalist id={`${name}-datalist`}>
        {datalist.map((item) => (
          <option key={item.value} value={item.value} />
        ))}
      </datalist>
      {/* @ts-expect-error strictNullChecks */}
      <InputField {...commonProps} list={`${name}-datalist`} type={format} />
    </>
  ) : (
    // @ts-expect-error strictNullChecks
    <InputField
      {...commonProps}
      type={format === 'password' && !hidePassword ? 'text' : format}
      value={value as string}
    />
  );
}
