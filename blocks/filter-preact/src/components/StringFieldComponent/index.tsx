import classNames from 'classnames';
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { FieldComponentProps, StringField } from '../../../block';

export default function StringFieldComponent({
  className,
  field,
  highlight,
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
      className={classNames('input my-2', className, { 'is-loading': loading, 'mx-2': highlight })}
      name={field.name}
      onInput={handleChange}
      value={value}
    />
  );
}
