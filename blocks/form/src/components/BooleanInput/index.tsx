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
  const { label, labelText, readOnly, tag } = field;

  const checkboxLabel = utils.remap(label, value);
  const required = isRequired(field);

  return (
    <CheckboxField
      className={classNames('appsemble-boolean', { 'is-danger': error })}
      disabled={disabled}
      error={dirty && error}
      label={checkboxLabel}
      name={name}
      onChange={onChange}
      optionalLabel={<FormattedMessage id="optionalLabel" />}
      readOnly={readOnly}
      required={required}
      tag={utils.remap(tag, value)}
      title={utils.remap(labelText, value) ?? checkboxLabel ?? null}
      value={Boolean(value)}
    />
  );
}
