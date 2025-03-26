import { useBlock } from '@appsemble/preact';
import { Button } from '@appsemble/preact-components';
import { type ComponentProps, type VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import styles from './index.module.css';
import { type DropdownOption as DropdownOptionType } from '../../../block.js';

interface DropdownItemProps extends ComponentProps<'td'> {
  /**
   * The item to display.
   */
  readonly item: unknown;

  /**
   * The data of the record that item is a part of.
   */
  readonly record: unknown;

  /**
   * The option that is being rendered.
   */
  readonly option: DropdownOptionType;

  /**
   * The index of the row that was clicked.
   */
  readonly index: number;

  /**
   * The index of the sub row that was clicked.
   */
  readonly repeatedIndex: number;
}

/**
 * Render a dropdown option.
 */
export function DropdownOption({
  index,
  item,
  option,
  record,
  repeatedIndex,
}: DropdownItemProps): VNode {
  const {
    actions,
    utils: { remap },
  } = useBlock();

  const onClick = useCallback(() => {
    actions[option.onClick](record, { index, repeatedIndex });
  }, [actions, index, option.onClick, record, repeatedIndex]);

  const label = remap(option.label, item, { index, repeatedIndex }) as string;
  const disabled = remap(option.disabled, item, { index, repeatedIndex }) as boolean;
  return (
    <Button
      className={`dropdown-item pl-5 ${styles.noBorder}`}
      disabled={disabled ?? false}
      icon={option.icon}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
