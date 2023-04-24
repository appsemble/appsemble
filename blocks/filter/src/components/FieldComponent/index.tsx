import { type VNode } from 'preact';

import {
  type ButtonsField,
  type DateField,
  type DateRangeField,
  type EnumField,
  type Field,
  type FieldComponentProps,
  type StringField,
} from '../../../block.js';
import { ButtonsFieldComponent } from '../ButtonsFieldComponent/index.js';
import { DateFieldComponent } from '../DateFieldComponent/index.js';
import { DateRangeFieldComponent } from '../DateRangeFieldComponent/index.js';
import { EnumFieldComponent } from '../EnumFieldComponent/index.js';
import { StringFieldComponent } from '../StringFieldComponent/index.js';

export function FieldComponent(props: FieldComponentProps<Field>): VNode {
  const { field } = props;
  switch (field.type) {
    case 'buttons':
      return <ButtonsFieldComponent {...(props as FieldComponentProps<ButtonsField>)} />;
    case 'date':
      return <DateFieldComponent {...(props as FieldComponentProps<DateField>)} />;
    case 'date-range':
      return <DateRangeFieldComponent {...(props as FieldComponentProps<DateRangeField>)} />;
    case 'enum':
      return <EnumFieldComponent {...(props as FieldComponentProps<EnumField>)} />;
    case 'string':
      return <StringFieldComponent {...(props as FieldComponentProps<StringField>)} />;
    default:
      return null;
  }
}
