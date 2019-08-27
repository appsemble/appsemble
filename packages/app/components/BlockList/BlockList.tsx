import { Block as BlockType } from '@appsemble/types';
import React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import { ShowDialogAction } from '../../types';
import Block from '../Block';
import styles from './BlockList.css';

export interface BlockListProps {
  counter: number;
  currentPage?: number;
  blocks: BlockType[];
  data?: any;
  emitEvent(name: string, data: any): void;
  flowActions: {};
  offEvent(name: string, callback: Function): void;
  onEvent(name: string, callback: Function): void;
  showDialog: ShowDialogAction;
  transitions?: boolean;
}

export default class BlockList extends React.Component<BlockListProps> {
  static defaultProps: Partial<BlockListProps> = {
    transitions: false,
    data: undefined,
  };

  render(): React.ReactNode {
    const {
      blocks,
      counter,
      currentPage,
      data,
      emitEvent,
      flowActions,
      offEvent,
      onEvent,
      showDialog,
      transitions,
    } = this.props;

    const list = blocks.map((block, index) => {
      const content = (
        <Block
          // As long as blocks are in a static list, using the index as a key should be fine.
          // eslint-disable-next-line react/no-array-index-key
          key={`${index}.${counter}`}
          block={block}
          data={data}
          emitEvent={emitEvent}
          flowActions={flowActions}
          offEvent={offEvent}
          onEvent={onEvent}
          showDialog={showDialog}
        />
      );

      return transitions ? (
        <CSSTransition
          // Since blocks are in a static list, using the index as a key should be fine.
          // eslint-disable-next-line react/no-array-index-key
          key={`${currentPage}.${index}.${counter}`}
          classNames={{
            enter: styles.pageEnter,
            enterActive: styles.pageEnterActive,
            exit: styles.pageExit,
            exitActive: styles.pageExitActive,
          }}
          timeout={300}
        >
          <div className={styles.transitionWrapper}>{content}</div>
        </CSSTransition>
      ) : (
        content
      );
    });

    return transitions ? (
      <TransitionGroup className={styles.transitionGroup}>{list}</TransitionGroup>
    ) : (
      list
    );
  }
}
