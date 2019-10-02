/** @jsx h */
import { FormattedMessage } from '@appsemble/preact';
import { Input } from '@appsemble/preact-components';
import { h, VNode } from 'preact';

import { InputProps, NumberField } from '../../../block';

type NumberInputProps = InputProps<number, NumberField>;

/**
 * An input element for a number type schema.
 */
export default function NumberInput({ error, field, onInput, value }: NumberInputProps): VNode {
  return (
    <Input
      error={error && <FormattedMessage id="invalid" />}
      iconLeft={field.icon}
      id={field.name}
      label={field.label || field.name}
      max={field.max}
      min={field.min}
      name={field.name}
      onInput={event => {
        onInput(
          event,
          field.type === 'integer'
            ? Math.floor((event.target as HTMLInputElement).valueAsNumber)
            : (event.target as HTMLInputElement).valueAsNumber,
        );
      }}
      placeholder={field.placeholder}
      readOnly={field.readOnly}
      required={field.required}
      step={field.step || field.type === 'integer' ? 1 : undefined}
      type="number"
      value={value}
    />
  );
}
