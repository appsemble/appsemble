import { h, VNode } from 'preact';

import type { Field, InputProps } from '../../../block';
import { BooleanInput } from '../BooleanInput';
import { DateTimeInput } from '../DateTimeInput';
import { EnumInput } from '../EnumInput';
import { FileInput } from '../FileInput';
import { GeoCoordinatesInput } from '../GeoCoordinatesInput';
import { NumberInput } from '../NumberInput';
import { RadioInput } from '../RadioInput';
import { StringInput } from '../StringInput';

type FormInputProps = InputProps<any, Field>;

/**
 * Render any type of form input.
 */
export function FormInput({ field, ...props }: FormInputProps): VNode {
  switch (field.type) {
    case 'date-time':
      return <DateTimeInput field={field} {...props} />;
    case 'enum':
      return <EnumInput field={field} {...props} />;
    case 'file':
      return <FileInput field={field} {...props} />;
    case 'geocoordinates':
      return <GeoCoordinatesInput field={field} {...props} />;
    case 'string':
      return <StringInput field={field} {...props} />;
    case 'number':
    case 'integer':
      return <NumberInput field={field} {...props} />;
    case 'boolean':
      return <BooleanInput field={field} {...props} />;
    case 'radio':
      return <RadioInput field={field} {...props} />;
    default:
  }
}
