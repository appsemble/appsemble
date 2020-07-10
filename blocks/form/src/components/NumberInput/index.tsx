import { FormattedMessage } from '@appsemble/preact';
import { Input } from '@appsemble/preact-components';
import { h, VNode } from 'preact';

import type { InputProps, NumberField } from '../../../block';

type NumberInputProps = InputProps<number, NumberField>;

/**
 * An input element for a number type schema.
 */
export default function NumberInput({
  className,
  disabled,
  error,
  field,
  onInput,
  value,
}: NumberInputProps): VNode {
  return (
    <Input
      className={className}
      disabled={disabled}
      error={error && <FormattedMessage id="invalid" />}
      iconLeft={field.icon}
      id={field.name}
      label={field.label}
      max={field.max}
      min={field.min}
      name={field.name}
      onInput={(event) => {
        onInput(
          event,
          field.type === 'integer'
            ? Math.floor((event.currentTarget as HTMLInputElement).valueAsNumber)
            : (event.currentTarget as HTMLInputElement).valueAsNumber,
        );
      }}
      placeholder={field.placeholder || field.label || field.name}
      readOnly={field.readOnly}
      required={field.required}
      step={field.step || field.type === 'integer' ? 1 : undefined}
      type="number"
      value={value}
    />
  );
}
