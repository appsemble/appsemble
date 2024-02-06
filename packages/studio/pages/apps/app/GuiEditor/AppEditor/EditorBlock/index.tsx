import { Button, Icon } from '@appsemble/react-components';
import { type BlockManifest } from '@appsemble/types';
import classNames from 'classnames';
import { type ReactNode, useState } from 'react';

import styles from './index.module.css';
import { messages } from './messages.js';

/**
 * The draggable block in the editor.
 * On mouse down the handleDragStart method is called. In it the block is
 * attached to the mouse and hovered other blocks are highlighted.
 *
 * The dragged block is removed for the time being,
 * and is shown in its new position in real time.
 *
 * @returns EditorBlock
 */
interface EditorBlockProps {
  readonly block: BlockManifest;
  readonly blockIndex: number;
  readonly subPageIndex: number;
  readonly blockName: string;
  readonly onChange: (block: number, subPageIndex: number) => void;
  readonly onDragStart: (index: number, dragIndex: number) => void;
  readonly onDrop: (index: number) => void;
}
export function EditorBlock({
  block,
  blockIndex,
  blockName,
  onChange,
  onDragStart,
  onDrop,
  subPageIndex,
}: EditorBlockProps): ReactNode {
  const [dragOver, setDragOver] = useState<Boolean>(false);

  const onDragEnter = (): void => {
    setDragOver(true);
  };
  const onDragExit = (): void => {
    setDragOver(false);
  };
  const onDropBlock = (bIndex: number): void => {
    setDragOver(false);
    onDrop(bIndex);
  };

  return (
    <Button
      className={classNames(styles.blockContainer, dragOver ? styles.dragOver : '')}
      draggable
      key={`block${blockIndex}`}
      onClick={() => onChange(blockIndex, subPageIndex)}
      onDragEnter={onDragEnter}
      onDragExit={onDragExit}
      onDragLeave={onDragExit}
      onDragOver={(e) => e.preventDefault()}
      onDragStart={() => onDragStart(blockIndex, 2)}
      onDrop={() => onDropBlock(blockIndex)}
    >
      <figure className={`${styles.centerFigure} image is-64x64`}>
        {block ? (
          <img alt={`${blockName} ${messages.blockLogo}`} draggable={false} src={block.iconUrl} />
        ) : (
          <Icon className={styles.iconFallback} icon="cubes" />
        )}
      </figure>
      <h4>{blockName}</h4>
    </Button>
  );
}
