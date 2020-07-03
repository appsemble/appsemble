import classNames from 'classnames';
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { DateField, FieldComponentProps } from '../../../block';

export default function DateFieldComponent({
  field,
  highlight,
  loading,
  onChange,
  value,
}: FieldComponentProps<DateField>): VNode {
  const handleChange = useCallback(
    (event: h.JSX.TargetedEvent<HTMLInputElement>) => onChange(event, event.currentTarget.value),
    [onChange],
  );

  return (
    <input
      className={classNames('input my-2', { 'is-loading': loading, 'mx-2': highlight })}
      name={field.name}
      onChange={handleChange}
      type="date"
      value={value}
    />
  );
}
