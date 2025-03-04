import { useBlock } from '@appsemble/preact';
import { Icon } from '@appsemble/preact-components';
import { type VNode } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

import { ContentComponent } from './Content/index.js';
import { HeaderComponent } from './Header/index.js';
import { Image } from './Image/index.js';
import styles from './index.module.css';
import { type Item } from '../../../block.js';

interface ListItemProps {
  readonly index: number;
  readonly item: Item;
  readonly preventClick?: boolean;
}

export function ListItem({ index, item, preventClick }: ListItemProps): VNode {
  const {
    actions,
    parameters: { button, dropdown, image, imageInline },
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

  const [isVisible, setIsVisible] = useState(false);

  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      {
        // Trigger when 10% of the ref is visible
        threshold: 0.1,
      },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        observer.unobserve(ref.current);
      }
    };
  }, [index]);

  return (
    <div className={`${styles.item} has-text-left is-flex my-1 pt-4 pr-6 pb-4 pl-5`} ref={ref}>
      {image && !imageInline ? (
        <div className={styles.image}>
          {image.alignment === 'default' ? (
            <Image field={image} index={index} isVisible={isVisible} item={item} />
          ) : null}
        </div>
      ) : null}
      <div className={`${styles.contentWrapper} is-inline-block`}>
        {image && imageInline ? (
          <figure className={`image ${styles.image}`}>
            <Image field={image} index={index} isVisible={isVisible} item={item} />
          </figure>
        ) : null}
        <HeaderComponent index={index} isVisible={isVisible} item={item} />
        <ContentComponent index={index} item={item} />
      </div>
      {actions.onClick.type !== 'noop' && button == null && preventClick !== true && (
        <Icon className={`${styles.button} mx-0 my-0 px-0 py-0`} icon="angle-right" size="large" />
      )}
    </div>
  );
}
