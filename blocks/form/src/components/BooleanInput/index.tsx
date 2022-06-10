import { FormattedMessage, useBlock } from '@appsemble/preact';
import { CheckboxField } from '@appsemble/preact-components';
import classNames from 'classnames';
import { VNode } from 'preact';

import { BooleanField, InputProps } from '../../../block';
import { isRequired } from '../../utils/requirements';

type BooleanInputProps = InputProps<boolean, BooleanField>;

/**
 * An input element for a boolean value.
 */
export function BooleanInput({
  dirty,
  disabled,
  error,
  field,
  name,
  onChange,
  value,
}: BooleanInputProps): VNode {
  const { utils } = useBlock();
  const { color, label, labelText, readOnly, size, switch: switchType, tag } = field;

  const checkboxLabel = utils.remap(label, value);
  const required = isRequired(field);

  return (
    <CheckboxField
      className={classNames('appsemble-boolean', { 'is-danger': error })}
      color={color}
      disabled={disabled}
      error={dirty && error}
      label={checkboxLabel as string}
      name={name}
      onChange={onChange}
      optionalLabel={<FormattedMessage id="optionalLabel" />}
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
