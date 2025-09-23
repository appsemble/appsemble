import { Input } from '@appsemble/preact-components';
import { type VNode } from 'preact';

import { type FieldComponentProps, type StringField } from '../../../block.js';

export function StringFieldComponent({
  className,
  field,
  loading,
  onChange,
  value,
}: FieldComponentProps<StringField>): VNode {
  return (
    <Input
      className={className}
      loading={loading}
      name={field.name}
      // @ts-expect-error strictNullChecks undefined is not assignable
      onChange={onChange}
      value={value ?? ''}
    />
  );
}
