import { FormattedMessage, useBlock } from '@appsemble/preact';
import { Checkbox } from '@appsemble/preact-components/src';
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
  onInput,
  value = false,
}: BooleanInputProps): VNode {
  const { utils } = useBlock();
  const { label, labelText, name, readOnly } = field;

  const checkboxLabel = utils.remap(label, value);

  const required = isRequired(field);

  return (
    <Checkbox
      checked={Boolean(value)}
      className={classNames('appsemble-boolean', { 'is-danger': error })}
      disabled={disabled}
      error={error && <FormattedMessage id="invalid" />}
      help={utils.remap(labelText, value) ?? checkboxLabel ?? null}
      id={name}
      label={checkboxLabel}
      name={name}
      onChange={onInput}
      readOnly={readOnly}
      required={required}
    />
  );
}
