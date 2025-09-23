import { type VNode } from 'preact';

import {
  type BooleanField,
  type ButtonsField,
  type DateField,
  type DateRangeField,
  type EnumField,
  type Field,
  type FieldComponentProps,
  type ListField,
  type RangeField,
  type StringField,
} from '../../../block.js';
import { BooleanFieldComponent } from '../BooleanFieldComponent/index.js';
import { ButtonsFieldComponent } from '../ButtonsFieldComponent/index.js';
import { DateFieldComponent } from '../DateFieldComponent/index.js';
import { DateRangeFieldComponent } from '../DateRangeFieldComponent/index.js';
import { EnumFieldComponent } from '../EnumFieldComponent/index.js';
import { ListFieldComponent } from '../ListFieldComponent/index.js';
import { RangeFieldComponent } from '../RangeFieldComponent/index.js';
import { StringFieldComponent } from '../StringFieldComponent/index.js';

export function FieldComponent(props: FieldComponentProps<Field>): VNode | null {
  const { field } = props;
  switch (field.type) {
    case 'boolean':
      return <BooleanFieldComponent {...(props as FieldComponentProps<BooleanField>)} />;
    case 'buttons':
      return <ButtonsFieldComponent {...(props as FieldComponentProps<ButtonsField>)} />;
    case 'date':
      return <DateFieldComponent {...(props as FieldComponentProps<DateField>)} />;
    case 'date-range':
      return <DateRangeFieldComponent {...(props as FieldComponentProps<DateRangeField>)} />;
    case 'enum':
      return <EnumFieldComponent {...(props as FieldComponentProps<EnumField>)} />;
    case 'list':
      return <ListFieldComponent {...(props as FieldComponentProps<ListField>)} />;
    case 'range':
      return <RangeFieldComponent {...(props as FieldComponentProps<RangeField>)} />;
    case 'string':
      return <StringFieldComponent {...(props as FieldComponentProps<StringField>)} />;
    default:
      return null;
  }
}
