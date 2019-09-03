import { Loader } from '@appsemble/react-components';
import { Action, Block as BlockType } from '@appsemble/types';
import React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import { ShowDialogAction } from '../../types';
import Block from '../Block';
import styles from './BlockList.css';

export interface BlockListProps {
  actionCreators: Record<string, () => Action>;
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

interface BlockListState {
  blockStatus: Record<string, boolean>;
}

export default class BlockList extends React.Component<BlockListProps, BlockListState> {
  static defaultProps: Partial<BlockListProps> = {
    transitions: false,
    data: undefined,
  };

  state = {
    blockStatus: this.props.blocks.reduce<Record<string, boolean>>(
      (acc: Record<string, boolean>, block, index) => {
        acc[`${block.type}${index}`] = false;
        return acc;
      },
      {},
    ),
  };

  ready = (blockId: string): void => {
    this.setState(({ blockStatus }) => {
      return { blockStatus: { ...blockStatus, [blockId]: true } };
    });
  };

  render(): React.ReactNode {
    const {
      actionCreators,
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

    const { blockStatus } = this.state;
    const isLoading = Object.values(blockStatus).some(s => !s);

    const list = blocks.map((block, index) => {
      const content = (
        <Block
          // As long as blocks are in a static list, using the index as a key should be fine.
          // eslint-disable-next-line react/no-array-index-key
          key={`${index}.${counter}`}
          actionCreators={actionCreators}
          block={block}
          className={isLoading ? 'is-hidden' : ''}
          data={data}
          emitEvent={emitEvent}
          flowActions={flowActions}
          offEvent={offEvent}
          onEvent={onEvent}
          ready={() => this.ready(`${block.type}${index}`)}
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

    return (
      <>
        {isLoading && <Loader />}
        {transitions ? (
          <TransitionGroup className={styles.transitionGroup}>{list}</TransitionGroup>
        ) : (
          list
        )}
      </>
    );
  }
}
