import { type VNode } from 'preact';

import styles from './index.module.css';
import { type SelectionChoice } from '../../../../block.js';
import { Content } from '../Content/index.js';
import { Header } from '../Header/index.js';
import { Image } from '../Image/index.js';

interface SelectionOptionProps {
  readonly option: SelectionChoice;
  readonly onRemove: (id: number | string) => void;
  readonly showRemove: boolean;
}

export function SelectionEntry({ onRemove, option, showRemove }: SelectionOptionProps): VNode {
  const { id, image, imageInline } = option;
  const alignment = image?.alignment || 'default';

  const onRemoveClick = (): void => {
    onRemove(id);
  };

  return (
    <div className={`${styles.option} has-text-left is-flex mb-4 p-2`}>
      {image && !imageInline ? (
        <div className={styles.image}>
          {alignment === 'default' ? <Image id={id} image={image} option={option} /> : null}
        </div>
      ) : null}
      <div className={`${styles.contentWrapper} is-inline-block`}>
        {image && imageInline ? (
          <figure className={`image ${styles.image}`}>
            <Image id={id} image={image} option={option} />
          </figure>
        ) : null}
        <Header id={id} option={option} />
        <Content option={option} />
      </div>
      <div className="mb-2">
        {showRemove ? (
          <button className="delete" name={`remove-${id}`} onClick={onRemoveClick} type="button" />
        ) : (
          <button className="delete is-invisible" type="button" />
        )}
      </div>
    </div>
  );
}
