import { useBlock } from '@appsemble/preact';
import { type ComponentChild, type VNode } from 'preact';
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
    (event: MouseEvent) => {
      event.preventDefault();
      actions.onClick(item);
    },
    [actions, item],
  );
  const alt = remap(card.image?.alt, item) as string;
  const title = remap(card.title, item) as string;
  const subtitle = remap(card.subtitle, item) as string;
  const content = remap(card.content, item) as string;

  // The control stretches over the image and the content, so the whole area is clickable.
  // Without text, the image alt names it.
  const control = (children: ComponentChild): ComponentChild =>
    actions.onClick.type === 'noop' ? (
      children
    ) : actions.onClick.type === 'link' ? (
      <a
        aria-label={children ? undefined : alt}
        className={styles.control}
        href={actions.onClick.href(item)}
        onClick={handleClick}
      >
        {children}
      </a>
    ) : (
      <button
        aria-label={children ? undefined : alt}
        className={styles.control}
        onClick={handleClick}
        type="button"
      >
        {children}
      </button>
    );

  return (
    <div className="card">
      <div className={styles.main}>
        <div class="card-image">
          <figure className="image">
            <img alt={alt} className={styles['image-size']} src={imageSrc} />
          </figure>
        </div>
        <div class="card-content">
          <p className={`is-5 title ${styles.hiddenOverflow}`}>{title ? control(title) : null}</p>
          <p className={`is-6 title ${styles.hiddenOverflow}`}>{subtitle}</p>
          <div className="content">{title ? content : control(content)}</div>
        </div>
      </div>
      <footer className="card-footer">
        {card.footer?.map((button) => (
          <ButtonComponent field={button} index={index} item={item} />
        ))}
      </footer>
    </div>
  );
}
