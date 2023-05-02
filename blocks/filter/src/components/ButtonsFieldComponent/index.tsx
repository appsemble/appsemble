import { useBlock } from '@appsemble/preact';
import { ButtonGroup, ButtonOption } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';

import styles from './index.module.css';
import { type ButtonsField, type FieldComponentProps } from '../../../block.js';

export function ButtonsFieldComponent({
  className,
  field,
  highlight,
  loading,
  onChange,
  value,
}: FieldComponentProps<ButtonsField>): VNode {
  const { utils } = useBlock();

  return (
    <ButtonGroup
      className={`is-flex ${className} ${styles.root}`}
      name={field.name}
      onChange={onChange}
      value={value}
    >
      {field.options.map(({ icon, label, value: val }) => (
        // eslint-disable-next-line react/jsx-key
        <ButtonOption
          activeClassName="is-primary is-selected"
          className={classNames(styles.button, { 'is-marginless': highlight })}
          icon={icon}
          loading={loading}
          multiple
          value={val}
        >
          {(utils.remap(label, {}) as string) || value}
        </ButtonOption>
      ))}
    </ButtonGroup>
  );
}
