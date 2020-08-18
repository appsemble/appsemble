import { FormattedMessage, useBlock } from '@appsemble/preact';
import { Input } from '@appsemble/preact-components';
import { h, VNode } from 'preact';

import type { InputProps, NumberField } from '../../../block';
import { isRequired } from '../../utils/isRequired';

type NumberInputProps = InputProps<number, NumberField>;

/**
 * An input element for a number type schema.
 */
export function NumberInput({ disabled, error, field, onInput, value }: NumberInputProps): VNode {
  const { utils } = useBlock();
  const { name, label, type, placeholder, readOnly, icon, requirements = [] } = field;
  const required = isRequired(field);
  const max = Math.max(
    ...requirements
      ?.map((requirement) => 'max' in requirement && requirement.max)
      .filter(Number.isFinite),
  );

  const min = Math.min(
    ...requirements
      ?.map((requirement) => 'min' in requirement && requirement.min)
      .filter(Number.isFinite),
  );

  let step = Math.min(
    ...requirements
      ?.map((requirement) => 'step' in requirement && requirement.step)
      .filter(Number.isFinite),
  );

  if (Number.isFinite(step)) {
    step = type === 'integer' ? Math.floor(step) : step;
  } else {
    step = undefined;
  }

  return (
    <Input
      className="appsemble-number"
      disabled={disabled}
      error={error && <FormattedMessage id="invalid" />}
      iconLeft={icon}
      id={name}
      label={label}
      max={Number.isFinite(max) ? max : undefined}
      min={Number.isFinite(min) ? min : undefined}
      name={name}
      onInput={(event) => {
        onInput(
          event,
          type === 'integer'
            ? Math.floor((event.currentTarget as HTMLInputElement).valueAsNumber)
            : (event.currentTarget as HTMLInputElement).valueAsNumber,
        );
      }}
      placeholder={utils.remap(placeholder, value) || utils.remap(label, value) || name}
      readOnly={readOnly}
      required={required}
      step={step}
      type="number"
      value={value}
    />
  );
}
