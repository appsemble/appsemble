import { useBlock } from '@appsemble/preact';
import classNames from 'classnames';
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
    utils: { asset, formatMessage, remap },
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
  // A footer of only links continues the card content instead of forming a separate bar.
  const linkFooter = card.footer?.every(
    ({ onClick }) => (onClick ? actions[onClick] : actions.onClick).type === 'link',
  );

  // The control stretches over the image and the content, so the whole area is clickable.
  // It wraps the first text of the card. Without text, the image alt or a generic label names it.
  const textHost = title ? 'title' : subtitle ? 'subtitle' : content ? 'content' : undefined;
  const control = (children?: ComponentChild): ComponentChild =>
    actions.onClick.type === 'noop' ? (
      children
    ) : actions.onClick.type === 'link' ? (
      <a
        aria-label={children ? undefined : alt || formatMessage('openCard')}
        className={styles.control}
        href={actions.onClick.href(item)}
        onClick={handleClick}
      >
        {children}
      </a>
    ) : (
      <button
        aria-label={children ? undefined : alt || formatMessage('openCard')}
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
          <p className={`is-5 title ${styles.hiddenOverflow}`}>
            {textHost === 'title' ? control(title) : title}
          </p>
          <p className={`is-6 title ${styles.hiddenOverflow}`}>
            {textHost === 'subtitle' ? control(subtitle) : subtitle}
          </p>
          <div className="content">{textHost === 'content' ? control(content) : content}</div>
          {textHost ? null : control()}
        </div>
      </div>
      <footer className={classNames('card-footer', { [styles.linkFooter]: linkFooter })}>
        {card.footer?.map((button) => (
          <ButtonComponent field={button} index={index} item={item} />
        ))}
      </footer>
    </div>
  );
}
