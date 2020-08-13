import classNames from 'classnames';
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { FieldComponentProps, StringField } from '../../../block';

export function StringFieldComponent({
  className,
  field,
  loading,
  onChange,
  value,
}: FieldComponentProps<StringField>): VNode {
  const handleChange = useCallback(
    (event: h.JSX.TargetedEvent<HTMLInputElement>) => onChange(event, event.currentTarget.value),
    [onChange],
  );

  return (
    <input
      className={classNames(`input ${className}`, { 'is-loading': loading })}
      id={field.name}
      name={field.name}
      onInput={handleChange}
      value={value}
    />
  );
}
