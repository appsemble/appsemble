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
   * The option that is being rendered.
   */
  readonly option: DropdownOptionType;

  /**
   * The index of the row that was clicked.
   */
  readonly index: number;
}

/**
 * Render a dropdown option.
 */
export function DropdownOption({ index, item, option }: DropdownItemProps): VNode {
  const {
    actions,
    utils: { remap },
  } = useBlock();

  const onClick = useCallback(() => {
    actions[option.onClick](item, { index });
  }, [actions, index, option.onClick, item]);

  const label = remap(option.label, item, { index }) as string;
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
