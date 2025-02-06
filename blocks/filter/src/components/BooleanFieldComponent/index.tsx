import { useBlock } from '@appsemble/preact';
import { Checkbox } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';

import styles from './index.module.css';
import { type BooleanField, type FieldComponentProps } from '../../../block.js';

/**
 * An input element for a boolean value.
 */
export function BooleanFieldComponent({
  className,
  field,
  highlight,
  loading,
  onChange,
  value,
}: FieldComponentProps<BooleanField>): VNode {
  const { utils } = useBlock();
  const { color, labelText, size, switch: switchType } = field;

  return (
    <div
      className={classNames('appsemble-boolean', className, {
        'is-loading': loading,
        [styles.highlight]: highlight,
      })}
    >
      <Checkbox
        color={color}
        id={field.name}
        label={(utils.remap(labelText, value) as string) ?? ''}
        name={field.name}
        onChange={onChange}
        size={size}
        switch={Boolean(switchType)}
        switchOptions={switchType}
        value={Boolean(value)}
      />
    </div>
  );
}
