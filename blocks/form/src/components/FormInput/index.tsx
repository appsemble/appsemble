import { type VNode } from 'preact';
import { useCallback, useState } from 'preact/hooks';

import { type Field, type InputProps } from '../../../block.js';
import { BooleanInput } from '../BooleanInput/index.js';
import { DateInput } from '../DateInput/index.js';
import { DateTimeInput } from '../DateTimeInput/index.js';
import { EnumInput } from '../EnumInput/index.js';
import { Fieldset } from '../Fieldset/index.js';
import { FileInput } from '../FileInput/index.js';
import { GeoCoordinatesInput } from '../GeoCoordinatesInput/index.js';
import { ListInput } from '../ListInput/index.js';
import { NumberInput } from '../NumberInput/index.js';
import { RadioInput } from '../RadioInput/index.js';
import { RangeInput } from '../RangeInput/index.js';
import { StaticField } from '../StaticField/index.js';
import { StringInput } from '../StringInput/index.js';

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
    case 'list':
      return <ListInput dirty={dirty} field={field} onChange={onChange} {...props} />;
    case 'static':
      return <StaticField field={field} {...props} />;
    case 'string':
      return <StringInput dirty={dirty} field={field} onChange={handleChange} {...props} />;
    case 'range':
      return <RangeInput dirty={dirty} field={field} onChange={handleChange} {...props} />;
    case 'number':
    case 'integer':
      return <NumberInput dirty={dirty} field={field} onChange={handleChange} {...props} />;
    case 'boolean':
      return <BooleanInput dirty={dirty} field={field} onChange={handleChange} {...props} />;
    case 'fieldset':
      return <Fieldset dirty={dirty} field={field} onChange={handleChange} {...props} />;
    case 'radio':
      return <RadioInput dirty={dirty} field={field} onChange={handleChange} {...props} />;
    default:
  }
}
