import { Button, useMessages } from '@appsemble/react-components';
import { type BlockDefinition, type PageDefinition } from '@appsemble/types';
import {
  type ChangeEvent,
  type MutableRefObject,
  type ReactElement,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import { type Document, type Node, type ParsedNode, type YAMLSeq } from 'yaml';

import { InputList } from '../../Components/InputList/index.js';
import { InputString } from '../../Components/InputString/index.js';
import { messages } from '../../messages.js';

interface PagePropertyProps {
  readonly addIn: (path: Iterable<number | string>, value: Node) => void;
  readonly changeIn: (path: Iterable<number | string>, value: Node) => void;
  readonly deleteIn: (path: Iterable<number | string>) => void;
  readonly deletePage: () => void;
  readonly docRef: MutableRefObject<Document<ParsedNode>>;
  readonly selectedPage: number;
  readonly selectedSubPage: number;
}

const pageTypes = ['page', 'flow', 'tabs'] as const;
export function PageProperty({
  addIn,
  changeIn,
  deleteIn,
  deletePage,
  docRef,
  selectedPage,
  selectedSubPage,
}: PagePropertyProps): ReactElement {
  const push = useMessages();
  const { formatMessage } = useIntl();
  const [currentPageName, setCurrentPageName] = useState(
    selectedPage === -1
      ? formatMessage(messages.pageName)
      : (docRef.current.getIn(['pages', selectedPage, 'name']) as string).trim(),
  );
  const [inputPageType, setInputPageType] = useState<(typeof pageTypes)[number]>('page');
  const [currentSubPage, setCurrentSubPage] = useState<number>(selectedSubPage);

  const onChangePageName = useCallback(
    (event: ChangeEvent<HTMLInputElement>, value: string) => {
      setCurrentPageName(value);
    },
    [setCurrentPageName],
  );

  const onChangePageType = useCallback(
    (index: number) => {
      setInputPageType(pageTypes[index]);
    },
    [setInputPageType],
  );

  const onChangePage = useCallback(() => {
    const doc = docRef.current;
    if (selectedPage === -1 && currentSubPage === -1) {
      // Create new page
      if (doc.toJS().pages.some((page: PageDefinition) => page.name === currentPageName)) {
        push({ body: formatMessage(messages.pageNameExists), color: 'danger' });
        return;
      }
      if (!currentPageName) {
        push({ body: formatMessage(messages.pageNameEmpty), color: 'danger' });
        return;
      }
      if (inputPageType === 'page') {
        addIn(['pages'], doc.createNode({ name: currentPageName, blocks: [] }));
      }
      if (inputPageType === 'flow') {
        addIn(['pages'], doc.createNode({ name: currentPageName, type: 'flow', steps: [] }));
        setCurrentSubPage(
          (doc.getIn(['pages', selectedPage, 'steps']) as YAMLSeq).items.length - 1,
        );
      }
      if (inputPageType === 'tabs') {
        addIn(['pages'], doc.createNode({ name: currentPageName, type: 'tabs', tabs: [] }));
      }
    } else if (selectedPage !== -1 && currentSubPage === -1) {
      // Update page
      if (
        doc
          .toJS()
          .pages.filter((value: PageDefinition, index: number) => index !== selectedPage)
          .some((page: PageDefinition) => page.name === currentPageName)
      ) {
        push({ body: formatMessage(messages.pageNameExists), color: 'danger' });
        return;
      }
      if (!currentPageName) {
        push({ body: formatMessage(messages.pageNameEmpty), color: 'danger' });
        return;
      }
      // Check if the changed page is the default page TODO check if page name is used anywhere else
      const oldName = doc.toJS().pages[selectedPage].name.trim();
      if (doc.toJS().defaultPage.trim() === oldName) {
        changeIn(['defaultPage'], doc.createNode(currentPageName.trim()));
      }
      changeIn(['pages', selectedPage, 'name'], doc.createNode(currentPageName.trim()));

      // Change page type from page to flow/tab (move blocks into steps/tabs)
      if (inputPageType !== 'page' && !doc.getIn(['pages', selectedPage, 'type'])) {
        changeIn(['pages', selectedPage, 'type'], doc.createNode(inputPageType));
        const pageBlocks = doc.getIn(['pages', selectedPage, 'blocks']);
        addIn(
          ['pages', selectedPage, inputPageType === 'flow' ? 'steps' : 'tabs', 0, 'name'],
          doc.createNode('Sub-page'),
        );
        addIn(
          ['pages', selectedPage, inputPageType === 'flow' ? 'steps' : 'tabs', 0, 'blocks'],
          doc.createNode(pageBlocks),
        );
        deleteIn(['pages', selectedPage, 'blocks']);
      }
      // From flow/tab to page
      if (
        (doc.getIn(['pages', selectedPage, 'type']) === 'flow' ||
          doc.getIn(['pages', selectedPage, 'type']) === 'tabs') &&
        inputPageType === 'page'
      ) {
        const subPageBlocks = (
          doc.getIn([
            'pages',
            selectedPage,
            doc.getIn(['pages', selectedPage, 'type']) === 'flow' ? 'steps' : 'tabs',
          ]) as YAMLSeq
        ).items.flatMap((subPage: any) =>
          subPage.getIn(['blocks']).items.map((block: BlockDefinition) => block),
        );

        const pageName = doc.getIn(['pages', selectedPage, 'name']);
        deleteIn(['pages', selectedPage]);
        addIn(['pages'], doc.createNode({ name: pageName, blocks: subPageBlocks }));
      }
      // From flow to tab or vice versa
      const pageType = doc.getIn(['pages', selectedPage, 'type']);
      if (pageType !== inputPageType && pageType) {
        const subPages = doc.getIn([
          'pages',
          selectedPage,
          pageType === 'flow' ? 'steps' : 'tabs',
        ]) as YAMLSeq;
        if (subPages.items.length < 2) {
          push({
            body: String(formatMessage(messages.flowPageWarning)),
            color: 'danger',
          });
        } else {
          changeIn(['pages', selectedPage, 'type'], doc.createNode(inputPageType));
          deleteIn(['pages', selectedPage, pageType === 'flow' ? 'steps' : 'tabs']);
          addIn(
            ['pages', selectedPage, inputPageType === 'flow' ? 'steps' : 'tabs'],
            doc.createNode(subPages),
          );
        }
      }
    }
  }, [
    docRef,
    selectedPage,
    currentSubPage,
    currentPageName,
    inputPageType,
    push,
    addIn,
    changeIn,
    deleteIn,
    formatMessage,
  ]);

  const onCreateSubPage = useCallback(() => {
    onChangePage();
    const doc = docRef.current;
    if (inputPageType === 'flow') {
      addIn(
        ['pages', selectedPage, 'steps'],
        doc.createNode({
          name: 'Sub-page',
          blocks: [
            // Add a action-button as a hack to prevent empty sub-page
            {
              type: 'action-button',
              version: '0.20.42',
              parameters: { icon: 'fas fa-home', title: 'title' },
            },
          ],
        }),
      );
      setCurrentSubPage((doc.getIn(['pages', selectedPage, 'steps']) as YAMLSeq).items.length - 1);
    } else {
      addIn(
        ['pages', selectedPage, 'tabs'],
        doc.createNode({
          name: 'Sub-page',
          blocks: [
            {
              type: 'action-button',
              version: '0.20.42',
              parameters: { icon: 'fas fa-home', title: 'title' },
            },
          ],
        }),
      );
      setCurrentSubPage((doc.getIn(['pages', selectedPage, 'tabs']) as YAMLSeq).items.length - 1);
    }
  }, [addIn, inputPageType, docRef, onChangePage, selectedPage]);

  useEffect(() => {
    setCurrentPageName(
      selectedPage === -1
        ? formatMessage(messages.pageName)
        : (docRef.current.getIn(['pages', selectedPage, 'name']) as string).trim(),
    );
  }, [docRef, formatMessage, selectedPage]);

  return (
    <div>
      {selectedPage !== -1 && (
        <Button className="is-danger" component="a" icon="trash" onClick={() => deletePage()}>
          {formatMessage(messages.deletePage)}
        </Button>
      )}
      <InputString label="Name" onChange={onChangePageName} value={currentPageName} />
      <InputList
        label="Type"
        onChange={onChangePageType}
        options={pageTypes}
        value={inputPageType}
      />
      <Button className="is-primary" component="a" icon="add" onClick={onChangePage}>
        {selectedPage === -1
          ? formatMessage(messages.createPage)
          : formatMessage(messages.savePage)}
      </Button>
      {inputPageType !== 'page' && selectedPage !== -1 && (
        <Button className="is-primary" component="a" icon="add" onClick={onCreateSubPage}>
          {formatMessage(messages.createSubPage)}
        </Button>
      )}
    </div>
  );
}

export default PageProperty;