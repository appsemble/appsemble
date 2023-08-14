import { useBlock } from '@appsemble/preact';
import { Icon } from '@appsemble/preact-components';
import { type VNode } from 'preact';

import { ContentComponent } from './Content/index.js';
import { HeaderComponent } from './Header/index.js';
import styles from './index.module.css';
import { type Item } from '../../../block.js';
import { ImageComponent } from '../Image/index.js';

interface ListItemProps {
  readonly index: number;
  readonly item: Item;
}

export function ListItem({ index, item }: ListItemProps): VNode {
  const {
    actions,
    parameters: { button, dropdown, image },
  } = useBlock();

  if (dropdown && !dropdown.alignment) {
    dropdown.alignment = 'bottom-right';
  }

  if (button && !button.alignment) {
    button.alignment = 'top-right';
  }

  if (image && !image.alignment) {
    image.alignment = 'default';
  }

  return (
    <div className={`${styles.item} has-text-left is-flex my-1 pt-4 pr-6 pb-4 pl-5`}>
      <div className={styles.image}>
        {image && image.alignment === 'default' ? (
          <ImageComponent field={image} index={index} item={item} />
        ) : null}
      </div>
      <div className={`${styles.contentWrapper} is-inline-block`}>
        <HeaderComponent index={index} item={item} />
        <ContentComponent index={index} item={item} />
      </div>
      {actions.onClick.type !== 'noop' && button == null && (
        <Icon className={`${styles.button} mx-0 my-0 px-0 py-0`} icon="angle-right" size="large" />
      )}
    </div>
  );
}
