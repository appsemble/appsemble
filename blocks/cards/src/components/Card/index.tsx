import { useBlock } from '@appsemble/preact';
import { type VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import styles from './index.module.css';
import { type Item } from '../../../block.js';
import { ButtonComponent } from '../Button/index.js';

interface CardContentProps {
  readonly index: number;
  readonly item: Item;
}
export function CardContent({ index, item }: CardContentProps): VNode {
  const {
    actions,
    parameters: { card, defaultImage },
    utils: { asset, remap },
  } = useBlock();

  const image = remap(card.image?.file, item) as string;
  const imageSrc = image ? asset(image) : asset(defaultImage);
  const handleClick = useCallback(
    (event: MouseEvent, data: Item) => {
      event.preventDefault();
      actions.onClick(data);
    },
    [actions],
  );
  const alt = remap(card.image?.alt, item) as string;
  const title = remap(card.title, item) as string;
  const subtitle = remap(card.subtitle, item) as string;
  const content = remap(card.content, item) as string;
  return (
    <div className="card">
      <div
        class={`card-image ${styles.cursor}`}
        onClick={(event) => handleClick(event, item)}
        role="none"
      >
        <figure className="image">
          <img alt={alt} className={styles['image-size']} src={imageSrc} />
        </figure>
      </div>
      <div
        class={`card-content ${styles.cursor}`}
        onClick={(event) => handleClick(event, item)}
        role="none"
      >
        <p className={`is-5 title ${styles.hiddenOverflow}`}>{title}</p>
        <p className={`is-6 title ${styles.hiddenOverflow}`}>{subtitle}</p>
        <div className="content">{content}</div>
      </div>
      <footer className="card-footer">
        {card.footer?.map((button) => (
          <div className="card-footer-item">
            <ButtonComponent field={button} index={index} item={item} />
          </div>
        ))}
      </footer>
    </div>
  );
}
