import { VNode } from 'preact';
import { useCallback, useState } from 'preact/hooks';

import { Field, InputProps } from '../../../block';
import { BooleanInput } from '../BooleanInput';
import { DateInput } from '../DateInput';
import { DateTimeInput } from '../DateTimeInput';
import { EnumInput } from '../EnumInput';
import { FileInput } from '../FileInput';
import { GeoCoordinatesInput } from '../GeoCoordinatesInput';
import { NumberInput } from '../NumberInput';
import { ObjectInput } from '../ObjectInput';
import { RadioInput } from '../RadioInput';
import { StringInput } from '../StringInput';

type FormInputProps = Omit<InputProps<any, Field>, 'dirty'>;

/**
 * Render any type of form input.
 */
export function FormInput({ field, onChange, ...props }: FormInputProps): VNode {
  const [dirty, setDirty] = useState(false);

  const handleChange = useCallback(
    (event: never, value: any) => {
      setDirty(true);
      onChange(field.name, value);
    },
    [field, onChange],
  );

  switch (field.type) {
    case 'date':
      return <DateInput dirty={dirty} field={field} onChange={handleChange} {...props} />;
    case 'date-time':
      return <DateTimeInput dirty={dirty} field={field} onChange={handleChange} {...props} />;
    case 'enum':
      return <EnumInput dirty={dirty} field={field} onChange={handleChange} {...props} />;
    case 'file':
      return <FileInput dirty={dirty} field={field} onChange={handleChange} {...props} />;
    case 'geocoordinates':
      return <GeoCoordinatesInput dirty={dirty} field={field} onChange={handleChange} {...props} />;
    case 'string':
      return <StringInput dirty={dirty} field={field} onChange={handleChange} {...props} />;
    case 'number':
    case 'integer':
      return <NumberInput dirty={dirty} field={field} onChange={handleChange} {...props} />;
    case 'boolean':
      return <BooleanInput dirty={dirty} field={field} onChange={handleChange} {...props} />;
    case 'object':
      return <ObjectInput dirty={dirty} field={field} onChange={handleChange} {...props} />;
    case 'radio':
      return <RadioInput dirty={dirty} field={field} onChange={handleChange} {...props} />;
    default:
  }
}
