import { useBlock } from '@appsemble/preact';
import { CheckboxField } from '@appsemble/preact-components';
import classNames from 'classnames';
import { h, VNode } from 'preact';

import type { BooleanField, InputProps } from '../../../block';
import { isRequired } from '../../utils/isRequired';

type BooleanInputProps = InputProps<boolean, BooleanField>;

/**
 * An input element for a boolean value.
 */
export function BooleanInput({
  disabled,
  error,
  field,
  name,
  onChange,
  value,
}: BooleanInputProps): VNode {
  const {
    parameters: { invalidLabel = 'This value is invalid', optionalLabel },
    utils,
  } = useBlock();
  const { label, labelText, readOnly, tag } = field;

  const checkboxLabel = utils.remap(label, value);

  const required = isRequired(field);

  return (
    <CheckboxField
      checked={Boolean(value)}
      className={classNames('appsemble-boolean', { 'is-danger': error })}
      disabled={disabled}
      error={error && utils.remap(invalidLabel, value)}
      help={utils.remap(labelText, value) ?? checkboxLabel ?? null}
      label={checkboxLabel}
      name={name}
      onChange={onChange}
      optionalLabel={utils.remap(optionalLabel, value)}
      readOnly={readOnly}
      required={required}
      tag={utils.remap(tag, value)}
    />
  );
}
