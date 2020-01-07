import React from 'react';

import BlockList from '../BlockList';
import DotProgressBar from '../DotProgressBar';

interface FlowPageProps extends React.ComponentPropsWithoutRef<typeof BlockList> {
  currentPage: number;
  subPages: any[];
}

export default function FlowPage({
  currentPage,
  subPages,
  ...blockListProps
}: FlowPageProps): React.ReactElement {
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
