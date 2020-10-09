import type { EventEmitter } from 'events';

import { Loader, useLocationString } from '@appsemble/react-components';
import type { BlockDefinition, PageDefinition, Remapper, Security } from '@appsemble/types';
import { checkAppRole } from '@appsemble/utils';
import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Redirect } from 'react-router-dom';

import type { ShowDialogAction } from '../../types';
import type { ActionCreators } from '../../utils/actions';
import { useAppDefinition } from '../AppDefinitionProvider';
import { Block } from '../Block';
import { useUser } from '../UserProvider';

interface BlockListProps {
  blocks: BlockDefinition[];
  data?: any;
  ee: EventEmitter;
  extraCreators?: ActionCreators;
  flowActions?: {};
  page: PageDefinition;
  prefix: string;
  remap: (remapper: Remapper, data: any, context: { [key: string]: any }) => any;
  showDialog: ShowDialogAction;
}

function filterBlocks(
  security: Security,
  blocks: BlockDefinition[],
  userRole: string,
): [BlockDefinition, number][] {
  return blocks
    .map<[BlockDefinition, number]>((block, index) => [block, index])
    .filter(
      ([block]) =>
        block.roles === undefined ||
        block.roles.length === 0 ||
        block.roles.some((r) => checkAppRole(security, r, userRole)),
    );
}

export function BlockList({
  blocks,
  data,
  ee,
  extraCreators,
  flowActions,
  page,
  prefix,
  remap,
  showDialog,
}: BlockListProps): ReactElement {
  const { definition, revision } = useAppDefinition();
  const { isLoggedIn, role } = useUser();
  const redirect = useLocationString();

  const blockList = useMemo(() => filterBlocks(definition.security, blocks, role), [
    blocks,
    definition,
    role,
  ]);

  const blockStatus = useRef(blockList.map(() => false));
  const [pageReady, setPageReady] = useState<Promise<void>>();

  const [isLoading, setLoading] = useState(true);
  const resolvePageReady = useRef<Function>();

  const ready = useCallback(
    (block: BlockDefinition) => {
      blockStatus.current[blockList.findIndex(([b]) => b === block)] = true;
      if (blockStatus.current.every(Boolean)) {
        setLoading(false);
        resolvePageReady.current();
      }
    },
    [blockList],
  );

  useEffect(() => {
    setPageReady(
      new Promise((resolve) => {
        resolvePageReady.current = resolve;
      }),
    );
  }, [blockList]);

  if (!blockList.length) {
    if (!isLoggedIn) {
      return <Redirect to={`/Login?${new URLSearchParams({ redirect })}`} />;
    }

    return <Redirect to="/" />;
  }

  return (
    <>
      {isLoading && <Loader />}
      {blockList.map(([block, index]) => (
        <Block
          // As long as blocks are in a static list, using the index as a key should be fine.
          block={block}
          data={data}
          ee={ee}
          extraCreators={extraCreators}
          flowActions={flowActions}
          key={`${prefix}.${index}-${revision}`}
          page={page}
          pageReady={pageReady}
          prefix={`${prefix}.${index}`}
          ready={ready}
          remap={remap}
          showDialog={showDialog}
        />
      ))}
    </>
  );
}
