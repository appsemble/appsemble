import {
  type BasicPageDefinition,
  type FlowPageDefinition,
  type TabsPageDefinition,
} from '@appsemble/lang-sdk';
import { Button } from '@appsemble/react-components';
import classNames from 'classnames';
import { type ReactNode, useCallback, useState } from 'react';
import { type Document, type ParsedNode, type YAMLMap, type YAMLSeq } from 'yaml';

import styles from './index.module.css';
import { type Page } from '../../../../../../types.js';
import { useApp } from '../../../index.js';
import { BlockItem } from '../../ElementsList/BlockItem/index.js';
import { PageItem } from '../../ElementsList/PageItem/index.js';
import { SubPageItem } from '../../ElementsList/SubPageItem/index.js';

interface StyleListProps {
  readonly onChange: (page: number, subParent: number, block: number, propName?: string) => void;
  readonly selectedPage: number;
  readonly selectedBlock: number;
  readonly selectedSubParent: number;
  readonly selectedProp?: string;
  readonly saveStack: Document<ParsedNode, true>;
}
export function StyleList({
  onChange,
  saveStack,
  selectedBlock,
  selectedPage,
  selectedProp,
  selectedSubParent,
}: StyleListProps): ReactNode {
  const { app } = useApp();
  const [disabledPages, setDisabledPages] = useState<number[]>([]);

  const pageNames: string[] = app.definition.pages.map((page) => page.name);
  const pages: Page[] = (saveStack.getIn(['pages']) as YAMLSeq).items.flatMap(
    (page: YAMLMap, pageIndex: number) => ({
      name: page.getIn(['name']) as string,
      type: (page.getIn(['type']) ?? 'page') as string,
      index: pageIndex,
    }),
  );
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

  const getSubPages = (pageIndex: number): Page[] => {
    if (pages[pageIndex].type && pages[pageIndex].type !== 'page') {
      return (
        saveStack.getIn([
          'pages',
          pageIndex,
          pages[pageIndex].type === 'flow' ? 'steps' : 'tabs',
        ]) as YAMLSeq
      ).items.map((subPage: any) => ({
        name: subPage.getIn(['name']) as string,
        type: 'subPage',
        index: pageIndex,
      }));
    }
  };

  const onSelectPage = useCallback(
    (index: number, subParentIndex: number) => {
      onChange(index, subParentIndex, -1);
    },
    [onChange],
  );
  const onSelectProp = useCallback(
    (propName: string) => {
      onChange(-1, -1, -1, propName);
    },
    [onChange],
  );

  return (
    <>
      {/* Body css shared prop: body */}
      <div key="body">
        <Button
          className={classNames(styles.parentTop, {
            'is-link': selectedProp === 'body',
          })}
          onClick={() => onSelectProp('layout')}
        >
          Layout
        </Button>
        <Button
          className={classNames(styles.parentTop, {
            'is-link': selectedProp === 'body',
          })}
          onClick={() => onSelectProp('html')}
        >
          Body
        </Button>
      </div>
      <div key="nav">
        <Button
          className={classNames(styles.parentTop, {
            'is-link': selectedProp === 'nav-bar',
          })}
          onClick={() => onSelectProp('.nav-bar')}
        >
          Nav
        </Button>
      </div>
      {/* Button css shared prop: .button */}
      <div key="button">
        <Button
          className={classNames(styles.parentTop, {
            'is-link': selectedProp === 'button',
          })}
          onClick={() => onSelectProp('.button')}
        >
          Button
        </Button>
      </div>
      {/* Blocks css prop: [data-block='@appsemble/button-list'] */}
      {pageNames.map((page, pageIndex) => (
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
                onChange={onChange}
                pageIndex={pageIndex}
                saveStack={saveStack}
                selectedBlock={selectedBlock}
                selectedPage={selectedPage}
              />
              <SubPageItem
                blocks={blocks}
                onChange={onChange}
                onSelectSubPage={onSelectPage}
                saveStack={saveStack}
                selectedBlock={selectedBlock}
                selectedPage={selectedPage}
                selectedSubParent={selectedSubParent}
                subPages={getSubPages(pageIndex)}
              />
            </>
          )}
        </div>
      ))}
    </>
  );
}
