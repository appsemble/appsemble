import { useBlock } from '@appsemble/preact';
import { CheckboxField } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';

import { type BooleanField, type InputProps } from '../../../block.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import { isRequired } from '../../utils/requirements.js';

type BooleanInputProps = InputProps<boolean, BooleanField>;

/**
 * An input element for a boolean value.
 */
export function BooleanInput({
  className,
  dirty,
  disabled,
  error,
  field,
  formValues,
  name,
  onChange,
  readOnly,
}: BooleanInputProps): VNode {
  const { utils } = useBlock();
  const { color, help, icon, inline, label, labelText, size, switch: switchType, tag } = field;

  const value = getValueByNameSequence(name, formValues);
  const checkboxLabel = utils.remap(label, value);
  const required = isRequired(field, utils, formValues);

  return (
    <CheckboxField
      className={classNames('appsemble-boolean', className, { 'is-danger': error })}
      color={color}
      disabled={disabled}
      error={dirty ? error : null}
      help={utils.remap(help, value) as string}
      icon={icon}
      inline={inline}
      label={checkboxLabel as string}
      name={name}
      onChange={onChange}
      optionalLabel={utils.formatMessage('optionalLabel')}
      readOnly={readOnly}
      required={required}
      size={size}
      switch={Boolean(switchType)}
      switchOptions={switchType}
      tag={utils.remap(tag, value) as string}
      title={(utils.remap(labelText, value) as string) ?? (checkboxLabel as string) ?? null}
      value={Boolean(value)}
    />
  );
}
