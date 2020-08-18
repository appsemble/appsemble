import classNames from 'classnames';
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import { Button, Props, useValuePicker } from '..';

interface ButtonOptionProps extends Omit<Props<typeof Button>, 'value'> {
  activeClassName: string;

  multiple?: boolean;

  value: unknown;
}

export function ButtonOption({
  activeClassName,
  className,
  multiple,
  value,
  ...props
}: ButtonOptionProps): VNode {
  const { name, onChange, value: currentValue } = useValuePicker();
  const values = currentValue as unknown[];

  const onClick = useCallback(
    (event: h.JSX.TargetedEvent<HTMLButtonElement>) => {
      if (multiple) {
        const index = values.indexOf(value);
        if (index === -1) {
          onChange(event, [...values, value]);
        } else {
          onChange(event, [...values.slice(0, index), ...values.slice(index + 1)]);
        }
      } else {
        onChange(event, value);
      }
    },
    [multiple, onChange, value, values],
  );

  return (
    <Button
      name={name}
      {...props}
      className={classNames(className, {
        [activeClassName]: multiple ? values.includes(value) : value === currentValue,
      })}
      onClick={onClick}
    />
  );
}
