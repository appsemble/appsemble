import { useBlock } from '@appsemble/preact/src';
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { Field, FieldError, InputProps } from '../../../block';
import { validate } from '../../utils/validators';
import { BooleanInput } from '../BooleanInput';
import { DateTimeInput } from '../DateTimeInput';
import { EnumInput } from '../EnumInput';
import { FileInput } from '../FileInput';
import { GeoCoordinatesInput } from '../GeoCoordinatesInput';
import { NumberInput } from '../NumberInput';
import { ObjectInput } from '../ObjectInput';
import { RadioInput } from '../RadioInput';
import { StringInput } from '../StringInput';

type FormInputProps = InputProps<any, Field>;

/**
 * Render any type of form input.
 */
export function FormInput({ field, onChange, ...props }: FormInputProps): VNode {
  const { utils } = useBlock();

  const handleChange = useCallback(
    (event: never, value: any, validity?: FieldError) => {
      onChange(field.name, value, validity || validate(field, value, utils));
    },
    [field, onChange, utils],
  );

  switch (field.type) {
    case 'date-time':
      return <DateTimeInput field={field} onChange={handleChange} {...props} />;
    case 'enum':
      return <EnumInput field={field} onChange={handleChange} {...props} />;
    case 'file':
      return <FileInput field={field} onChange={handleChange} {...props} />;
    case 'geocoordinates':
      return <GeoCoordinatesInput field={field} onChange={handleChange} {...props} />;
    case 'string':
      return <StringInput field={field} onChange={handleChange} {...props} />;
    case 'number':
    case 'integer':
      return <NumberInput field={field} onChange={handleChange} {...props} />;
    case 'boolean':
      return <BooleanInput field={field} onChange={handleChange} {...props} />;
    case 'object':
      return <ObjectInput field={field} onChange={handleChange} {...props} />;
    case 'radio':
      return <RadioInput field={field} onChange={handleChange} {...props} />;
    default:
  }
}
