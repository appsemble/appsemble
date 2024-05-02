import { Button } from '@appsemble/preact-components';
import { type VNode } from 'preact';

import styles from './index.module.css';
import { type SelectionChoice } from '../../../../block.js';
import { Content } from '../Content/index.js';
import { Header } from '../Header/index.js';
import { Image } from '../Image/index.js';

interface SelectionOptionProps {
  readonly option: SelectionChoice;
  readonly onAdd: (id: number) => void;
}

export function SelectionOption({ onAdd, option }: SelectionOptionProps): VNode {
  const { id, image, imageInline } = option;
  const alignment = image?.alignment || 'default';

  const onAddClick = (): void => {
    onAdd(id);
  };

  return (
    <div className={`${styles.option} has-text-left is-flex my-1 p-2`}>
      {image && !imageInline ? (
        <div className={styles.image}>
          {alignment === 'default' ? <Image image={image} index={id} option={option} /> : null}
        </div>
      ) : null}
      <div className={`${styles.contentWrapper} is-inline-block`}>
        {image && imageInline ? (
          <figure className={`image ${styles.image}`}>
            <Image image={image} index={id} option={option} />
          </figure>
        ) : null}
        <Header index={id} option={option} />
        <Content option={option} />
      </div>
      <div className="is-flex is-flex-direction-column is-justify-content-end">
        <Button icon="plus" onClick={onAddClick} />
      </div>
    </div>
  );
}
