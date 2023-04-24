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
  item: unknown;

  /**
   * The data of the record that item is a part of.
   */
  record: unknown;

  /**
   * The option that is being rendered.
   */
  option: DropdownOptionType;

  /**
   * The index of the row that was clicked.
   */
  index: number;

  /**
   * The index of the sub row that was clicked.
   */
  repeatedIndex: number;
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
  return (
    <Button
      className={`dropdown-item pl-5 ${styles.noBorder}`}
      icon={option.icon}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
