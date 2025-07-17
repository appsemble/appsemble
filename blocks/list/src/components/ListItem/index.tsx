import { useBlock } from '@appsemble/preact';
import { type VNode } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

import { ContentComponent } from './Content/index.js';
import { FooterComponent } from './Footer/index.js';
import { HeaderComponent } from './Header/index.js';
import styles from './index.module.css';
import { type Item } from '../../../block.js';

interface ListItemProps {
  readonly index: number;
  readonly item: Item;
}

export function ListItem({ index, item }: ListItemProps): VNode {
  const {
    parameters: {
      itemDefinition: { content, footer, header },
    },
  } = useBlock();

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
    <div
      className={`${styles.item} has-text-left is-flex is-flex-direction-column my-1 py-2 pl-3 pr-2`}
      ref={ref}
    >
      {header ? <HeaderComponent index={index} isVisible={isVisible} item={item} /> : null}
      {content ? <ContentComponent index={index} isVisible={isVisible} item={item} /> : null}
      {footer ? <FooterComponent index={index} item={item} /> : null}
    </div>
  );
}
