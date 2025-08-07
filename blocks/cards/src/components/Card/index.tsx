import { useBlock } from '@appsemble/preact';
import { type VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import styles from './index.module.css';
import { type Item } from '../../../block.js';
import { ButtonComponent } from '../Button/index.js';
import { DropdownComponent } from '../Dropdown/index.js';

interface CardContentProps {
  readonly index: number;
  readonly item: Item;
}
export function CardContent({ index, item }: CardContentProps): VNode {
  const {
    actions,
    parameters: { defaultImage, itemDefinition },
    utils: { asset, remap },
  } = useBlock();

  const image = remap(itemDefinition.image?.file ?? null, item) as string;
  const imageSrc = image ? asset(image) : asset(defaultImage);
  const handleClick = useCallback(
    (event: MouseEvent, data: Item) => {
      event.preventDefault();
      actions.onClick(data);
    },
    [actions],
  );
  const alt = remap(itemDefinition.image?.alt ?? null, item) as string;
  const title = remap(itemDefinition.title, item) as string;
  const content = remap(itemDefinition.content, item) as string;
  return (
    <div class="card">
      <header className="card-header">
        <p className="card-header-title">{title}</p>
        {'actionButton' in itemDefinition ? (
          <ButtonComponent
            classname="card-header-icon"
            field={itemDefinition.actionButton}
            index={index}
            item={item}
          />
        ) : 'dropdown' in itemDefinition ? (
          <DropdownComponent
            field={itemDefinition.dropdown}
            index={index}
            item={item}
            record={item}
          />
        ) : null}
      </header>
      <div
        class={`card-image ${styles.cursor}`}
        onClick={(event) => handleClick(event, item)}
        role="none"
      >
        <figure class="image">
          <img alt={alt} src={imageSrc} />
        </figure>
      </div>
      <div
        class={`card-content ${styles.cursor}`}
        onClick={(event) => handleClick(event, item)}
        role="none"
      >
        <div className="content">{content}</div>
      </div>
      <footer className="card-footer">
        {itemDefinition.footer?.map((button) => (
          <div className="card-footer-item">
            <ButtonComponent field={button} index={index} item={item} />
          </div>
        ))}
      </footer>
    </div>
  );
}
