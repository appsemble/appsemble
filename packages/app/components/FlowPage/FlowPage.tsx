import React, { ReactNode } from 'react';

import BlockList, { BlockListProps } from '../BlockList';
import DotProgressBar from '../DotProgressBar';

interface FlowPageProps {
  currentPage: number;
  subPages: any[];
}

export default class FlowPage extends React.Component<FlowPageProps & BlockListProps> {
  render(): ReactNode {
    const { currentPage, subPages, ...blockListProps } = this.props;

    return (
      <>
        <DotProgressBar active={currentPage} amount={subPages.length} />
        <BlockList
          {...blockListProps}
          blocks={subPages[currentPage].blocks}
          currentPage={currentPage}
          transitions
        />
      </>
    );
  }
}
