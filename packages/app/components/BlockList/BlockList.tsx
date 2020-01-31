import { Loader } from '@appsemble/react-components';
import { Block as BlockType, Security } from '@appsemble/types';
import { checkAppRole } from '@appsemble/utils';
import { EventEmitter } from 'events';
import React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import { ShowDialogAction } from '../../types';
import { ActionCreators } from '../../utils/actions';
import Block from '../Block';
import styles from './BlockList.css';

interface BlockListProps {
  counter: number;
  currentPage?: number;
  blocks: BlockType[];
  data?: any;
  ee: EventEmitter;
  extraCreators: ActionCreators;
  flowActions?: {};
  showDialog: ShowDialogAction;
  transitions?: boolean;
  role: string;
  security: Security;
}

interface BlockListState {
  blockStatus: Record<string, boolean>;
}

function filterBlocks(security: Security, blocks: BlockType[], userRole: string): BlockType[] {
  return blocks.filter(
    block =>
      block.roles === undefined ||
      block.roles.length === 0 ||
      block.roles.some(r => checkAppRole(security, r, userRole)),
  );
}

export default class BlockList extends React.Component<BlockListProps, BlockListState> {
  static defaultProps: Partial<BlockListProps> = {
    transitions: false,
    data: undefined,
  };

  state = {
    blockStatus: filterBlocks(this.props.security, this.props.blocks, this.props.role).reduce<
      Record<string, boolean>
    >((acc: Record<string, boolean>, block, index) => {
      acc[`${block.type}${index}`] = false;
      return acc;
    }, {}),
  };

  ready = (blockId: string): void => {
    this.setState(({ blockStatus }) => ({ blockStatus: { ...blockStatus, [blockId]: true } }));
  };

  render(): React.ReactNode {
    const {
      counter,
      currentPage,
      data,
      ee,
      extraCreators,
      flowActions,
      showDialog,
      transitions,
      security,
      blocks,
      role,
    } = this.props;
    const { blockStatus } = this.state;
    const isLoading = Object.values(blockStatus).some(s => !s);
    const list = filterBlocks(security, blocks, role).map((block, index) => {
      const content = (
        <Block
          // As long as blocks are in a static list, using the index as a key should be fine.
          // eslint-disable-next-line react/no-array-index-key
          key={`${index}.${counter}`}
          block={block}
          className={isLoading ? 'is-hidden' : ''}
          data={data}
          ee={ee}
          extraCreators={extraCreators}
          flowActions={flowActions}
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
