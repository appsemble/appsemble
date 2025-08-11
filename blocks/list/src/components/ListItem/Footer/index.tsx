import { useBlock } from '@appsemble/preact';
import { type VNode } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import styles from './index.module.css';
import { type Item } from '../../../../block.js';
import { ButtonComponent } from '../../Button/index.js';
import { DropdownComponent } from '../../Dropdown/index.js';
import { ToggleButtonComponent } from '../../ToggleButton/index.js';

interface FooterComponentProps {
  readonly index: number;
  readonly item: Item;
  readonly onItemClick: (event: Event) => void;
}

export function FooterComponent({ index, item, onItemClick }: FooterComponentProps): VNode {
  const {
    parameters: {
      itemDefinition: { footer },
    },
    utils: { remap },
  } = useBlock();

  const [contentValue, setContentValue] = useState<string>('');

  useEffect(() => {
    if ('content' in footer) {
      const remappedValue = remap(footer.content, item);
      setContentValue(remappedValue ? String(remappedValue) : null);
    }
  }, [footer, item, remap]);

  return (
    <div
      className={`${styles.footerWrapper} is-flex is-justify-content-space-between is-align-items-end`}
    >
      <div className={styles.footerContent}>{contentValue}</div>
      {'button' in footer ? (
        <ButtonComponent
          field={footer.button}
          index={index}
          item={item}
          onItemClick={onItemClick}
        />
      ) : null}
      {'toggleButton' in footer ? (
        <ToggleButtonComponent field={footer.toggleButton} index={index} item={item} />
      ) : null}
      {'dropdown' in footer ? (
        <DropdownComponent field={footer.dropdown} index={index} item={item} record={item} />
      ) : null}
    </div>
  );
}
