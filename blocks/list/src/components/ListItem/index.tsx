import { useBlock } from '@appsemble/preact';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { type MutableRef, useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { ContentComponent } from './Content/index.js';
import { FooterComponent } from './Footer/index.js';
import { HeaderComponent } from './Header/index.js';
import styles from './index.module.css';
import { type Item } from '../../../block.js';

interface ListItemProps {
  readonly index: number;
  readonly item: Item;
  readonly dataTestId?: string;
}

export function ListItem({ dataTestId, index, item }: ListItemProps): VNode {
  const {
    actions,
    parameters: {
      item: { content, footer, header },
    },
    pathIndex,
  } = useBlock();

  const [isVisible, setIsVisible] = useState(false);

  const itemHash = `${pathIndex}.item.${item.id}`;

  const itemHref = useMemo(() => {
    if (actions.onClick.type === 'link') {
      return actions.onClick.href(item);
    }
  }, [actions.onClick, item]);

  const onItemClick = useCallback(
    async (event: Event) => {
      event.preventDefault();
      event.stopPropagation();

      // We take the onClick action defined in the block actions
      const action = actions.onClick;
      if (action.type === 'link') {
        window.location.hash = `${pathIndex}.item.${item.id}`;
      }
      await action(item, { index });
    },
    [actions.onClick, index, item, pathIndex],
  );

  const ref = useRef<HTMLDivElement>();

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

  useEffect(() => {
    if (window.location.hash !== `#${itemHash}`) {
      return;
    }

    let cancelled = false;

    const scrollToItem = (): void => {
      const itemElement = ref.current;
      if (!itemElement || cancelled) {
        return;
      }

      const navbar = document.querySelector('.navbar');
      const navbarHeight = navbar?.getBoundingClientRect().height ?? 0;
      const itemPadding = 10;

      const top =
        itemElement.getBoundingClientRect().top + window.scrollY - itemPadding - navbarHeight;
      window.scrollTo({ top });
    };

    // We retry the scroll animation a couple of times with a callback chain because items load
    // asynchronously and the item corresponding to the hash could still be missing.
    let tries = 5;
    const tick = (): void => {
      scrollToItem();
      tries -= 1;
      if (tries > 0 && !cancelled) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);

    return () => {
      cancelled = true;
    };
  }, [itemHash]);

  return (
    // Keyboard users activate the item through the button or link in the header or content
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className={classNames(
        styles.item,
        'has-text-left is-flex is-flex-direction-column my-1 py-2 pl-3 pr-2',
        { [styles.clickable]: actions.onClick.type !== 'noop' },
      )}
      data-testid={dataTestId}
      id={itemHash}
      onClick={onItemClick}
      ref={(ref as MutableRef<HTMLDivElement>) || undefined}
    >
      {header ? (
        <HeaderComponent
          index={index}
          isVisible={isVisible}
          item={item}
          itemHref={itemHref}
          onItemClick={onItemClick}
        />
      ) : null}
      {content ? (
        <ContentComponent
          index={index}
          isVisible={isVisible}
          item={item}
          itemHref={itemHref}
          onItemClick={onItemClick}
        />
      ) : null}
      {footer ? <FooterComponent index={index} item={item} /> : null}
    </div>
  );
}
