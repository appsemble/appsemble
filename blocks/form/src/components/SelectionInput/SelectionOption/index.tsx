import { Button } from '@appsemble/preact-components';
import { type VNode } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

import styles from './index.module.css';
import { type SelectionChoice } from '../../../../block.js';
import { Content } from '../Content/index.js';
import { Header } from '../Header/index.js';
import { Image } from '../Image/index.js';

interface SelectionOptionProps {
  readonly option: SelectionChoice;
  readonly onAdd: (id: number | string) => void;
}

export function SelectionOption({ onAdd, option }: SelectionOptionProps): VNode {
  const { id, image, imageInline } = option;
  const alignment = image?.alignment || 'default';

  const [isVisible, setIsVisible] = useState(false);

  const ref = useRef();

  const onAddClick = (): void => {
    onAdd(id);
  };

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
  }, [id]);

  return (
    <div className={`${styles.option} has-text-left is-flex my-1 p-2`} ref={ref}>
      {image && !imageInline ? (
        <div className={styles.image}>
          {alignment === 'default' ? (
            <Image id={id} image={image} isVisible={isVisible} option={option} />
          ) : null}
        </div>
      ) : null}
      <div className={`${styles.contentWrapper} is-inline-block`}>
        {image && imageInline ? (
          <figure className={`image ${styles.image}`}>
            <Image id={id} image={image} isVisible={isVisible} option={option} />
          </figure>
        ) : null}
        <Header id={id} isVisible={isVisible} option={option} />
        <Content option={option} />
      </div>
      <div className="is-flex is-flex-direction-column is-justify-content-end">
        <Button icon="plus" onClick={onAddClick} />
      </div>
    </div>
  );
}
