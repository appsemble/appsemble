import { h, VNode } from 'preact';

import type {
  ButtonsField,
  DateField,
  DateRangeField,
  EnumField,
  Field,
  FieldComponentProps,
  StringField,
} from '../../../block';
import { ButtonsFieldComponent } from '../ButtonsFieldComponent';
import { DateFieldComponent } from '../DateFieldComponent';
import { DateRangeFieldComponent } from '../DateRangeFieldComponent';
import { EnumFieldComponent } from '../EnumFieldComponent';
import { StringFieldComponent } from '../StringFieldComponent';

export function FieldComponent(props: FieldComponentProps<Field>): VNode {
  switch (props.field.type) {
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
