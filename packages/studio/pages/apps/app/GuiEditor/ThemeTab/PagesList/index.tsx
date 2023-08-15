import {
  type BasicPageDefinition,
  type FlowPageDefinition,
  type TabsPageDefinition,
} from '@appsemble/types';
import { type MutableRefObject, type ReactElement, useCallback, useState } from 'react';
import { type Document, type ParsedNode } from 'yaml';

import { useApp } from '../../../index.js';
import { BlockItem } from '../../ElementsList/BlockItem/index.js';
import { PageItem } from '../../ElementsList/PageItem/PageItem.js';
import { SubPageItem } from '../../ElementsList/SubPageItem/index.js';

interface PagesListProps {
  readonly docRef: MutableRefObject<Document<ParsedNode>>;
  readonly onChange: (page: number, subParent: number, block: number) => void;
  readonly selectedPage: number;
  readonly selectedBlock: number;
  readonly selectedSubParent: number;
}
export function PagesList({
  docRef,
  onChange,
  selectedBlock,
  selectedPage,
  selectedSubParent,
}: PagesListProps): ReactElement {
  const { app } = useApp();
  const [disabledPages, setDisabledPages] = useState<number[]>([]);

  const pages: string[] = app.definition.pages.map((page) => page.name);
  const blocks: { type: string; parent: number; subParent: number; block: number }[] =
    app.definition.pages.flatMap((page, pageIndex) => {
      if (!page.type || page.type === 'page') {
        return (page as BasicPageDefinition).blocks.map((block, blockIndex) => ({
          type: 'page',
          parent: pageIndex,
          subParent: -1,
          block: blockIndex,
        }));
      }
      if (page.type === 'flow') {
        return (page as FlowPageDefinition).steps.flatMap((subPage, subPageIndex) =>
          subPage.blocks.map((block, blockIndex) => ({
            type: 'flow',
            parent: pageIndex,
            subParent: subPageIndex,
            block: blockIndex,
          })),
        );
      }
      if (page.type === 'tabs') {
        return (page as TabsPageDefinition).tabs.flatMap((subPage, subPageIndex) =>
          subPage.blocks.map((block, blockIndex) => ({
            type: 'tabs',
            parent: pageIndex,
            subParent: subPageIndex,
            block: blockIndex,
          })),
        );
      }
    });

  const onSelectPage = useCallback(
    (index: number, subParentIndex: number) => {
      onChange(index, subParentIndex, -1);
    },
    [onChange],
  );

  return (
    <>
      {pages.map((page, pageIndex) => (
        <div key={page}>
          <PageItem
            blocks={blocks}
            disabledPages={disabledPages}
            onSelectPage={onSelectPage}
            page={page}
            pageIndex={pageIndex}
            selectedBlock={selectedBlock}
            selectedPage={selectedPage}
            setDisabledPages={setDisabledPages}
          />
          {!disabledPages.includes(pageIndex) && (
            <>
              <BlockItem
                blocks={blocks}
                docRef={docRef}
                onChange={onChange}
                pageIndex={pageIndex}
                selectedBlock={selectedBlock}
                selectedPage={selectedPage}
              />
              <SubPageItem
                blocks={blocks}
                docRef={docRef}
                onChange={onChange}
                pageIndex={pageIndex}
                selectedBlock={selectedBlock}
                selectedPage={selectedPage}
                selectedSubParent={selectedSubParent}
              />
            </>
          )}
        </div>
      ))}
    </>
  );
}
