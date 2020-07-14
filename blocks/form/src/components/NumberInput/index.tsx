import { FormattedMessage } from '@appsemble/preact';
import { Input } from '@appsemble/preact-components';
import { h, VNode } from 'preact';

import type { InputProps, NumberField } from '../../../block';

type NumberInputProps = InputProps<number, NumberField>;

/**
 * An input element for a number type schema.
 */
export default function NumberInput({
  disabled,
  error,
  field: { name, label, type, placeholder, readOnly, icon, requirements = [] },
  onInput,
  value,
}: NumberInputProps): VNode {
  const required = Boolean(requirements?.find((req) => (req as RequiredRequirement).required));
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
      placeholder={placeholder || label || name}
      readOnly={readOnly}
      required={required}
      step={step}
      type="number"
      value={value}
    />
  );
}
