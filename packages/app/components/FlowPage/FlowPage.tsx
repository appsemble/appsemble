import React from 'react';

import BlockList from '../BlockList';
import DotProgressBar from '../DotProgressBar';

interface FlowPageProps {
  currentPage: number;
  subPages: any[];
}

export default function FlowPage({
  currentPage,
  subPages,
  ...blockListProps
}: FlowPageProps & React.ComponentPropsWithoutRef<typeof BlockList>): React.ReactElement {
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
