import {
  type BasicPageDefinition,
  type FlowPageDefinition,
  type TabsPageDefinition,
} from '@appsemble/types';
import { type ReactElement, useState } from 'react';

import { BlockItem } from './BlockItem/index.js';
import { PageItem } from './PageItem/PageItem.js';
import { SubBlockItem } from './PageItem/SubBlockItem/index.js';
import { useApp } from '../../../index.js';

interface PagesListProps {
  readonly selectedPage: number;
  readonly selectedBlock: number;
  readonly selectedSubParent: number;
  readonly onChange: (page: number, subParent: number, block: number) => void;
}
export function PagesList({
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

  return (
    <>
      {pages.map((page, pageIndex) => (
        <div key={page}>
          <PageItem
            blocks={blocks}
            disabledPages={disabledPages}
            onChange={onChange}
            page={page}
            pageIndex={pageIndex}
            selectedBlock={selectedBlock}
            selectedPage={selectedPage}
            setDisabledPages={setDisabledPages}
          />
          {!disabledPages.includes(pageIndex) && (
            <>
              <BlockItem
                app={app}
                blocks={blocks}
                onChange={onChange}
                pageIndex={pageIndex}
                selectedBlock={selectedBlock}
                selectedPage={selectedPage}
              />
              <SubBlockItem
                app={app}
                blocks={blocks}
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
