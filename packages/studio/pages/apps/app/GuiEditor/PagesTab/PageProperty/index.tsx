import { Button, useMessages } from '@appsemble/react-components';
import {
  type ChangeEvent,
  type MutableRefObject,
  type ReactElement,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { type Document, type Node, type ParsedNode, type YAMLSeq } from 'yaml';

import { InputList } from '../../Components/InputList/index.js';
import { InputString } from '../../Components/InputString/index.js';

interface PagePropertyProps {
  addIn: (path: Iterable<unknown>, value: Node) => void;
  changeIn: (path: Iterable<unknown>, value: Node) => void;
  deleteIn: (path: Iterable<unknown>) => void;
  deletePage: () => void;
  docRef: MutableRefObject<Document<ParsedNode>>;
  selectedPage: number;
  selectedSubPage: number;
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
  const [currentPageName, setCurrentPageName] = useState(
    selectedPage === -1
      ? 'Page Name'
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
      if (doc.toJS().pages.some((page: any) => page.name === currentPageName)) {
        push({ body: 'Page name already exists', color: 'danger' });
        return;
      }
      if (!currentPageName) {
        push({ body: 'Page name cannot be empty', color: 'danger' });
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
          .pages.filter((value: any, index: any) => index !== selectedPage)
          .some((page: any) => page.name === currentPageName)
      ) {
        push({ body: 'Page name already exists', color: 'danger' });
        return;
      }
      if (!currentPageName) {
        push({ body: 'Page name cannot be empty', color: 'danger' });
        return;
      }
      changeIn(['pages', selectedPage, 'name'], doc.createNode(currentPageName));

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
          subPage.getIn(['blocks']).items.map((block: any) => block),
        );

        const pageName = doc.getIn(['pages', selectedPage, 'name']);
        deleteIn(['pages', selectedPage]);
        addIn(['pages'], doc.createNode({ name: pageName, blocks: subPageBlocks }));
      }
      // From flow to tab or vice versa
      const pageType = doc.getIn(['pages', selectedPage, 'type']);
      if (pageType !== inputPageType) {
        const subPages = doc.getIn([
          'pages',
          selectedPage,
          pageType === 'flow' ? 'steps' : 'tabs',
        ]) as YAMLSeq;
        if (subPages.items.length < 2) {
          push({
            body: 'A flow page must have at least two sub-pages',
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
    addIn,
    changeIn,
    currentPageName,
    inputPageType,
    currentSubPage,
    deleteIn,
    docRef,
    push,
    selectedPage,
  ]);

  const onCreateSubPage = useCallback(() => {
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
    onChangePage();
  }, [addIn, inputPageType, docRef, onChangePage, selectedPage]);

  useEffect(() => {
    setCurrentPageName(
      selectedPage === -1
        ? 'Page name'
        : (docRef.current.getIn(['pages', selectedPage, 'name']) as string).trim(),
    );
  }, [docRef, selectedPage]);

  return (
    <div>
      {selectedPage !== -1 && (
        <Button className="is-danger" component="a" icon="trash" onClick={() => deletePage()}>
          Delete Page
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
        {selectedPage === -1 ? 'Create page' : 'Save page'}
      </Button>
      {inputPageType !== 'page' && selectedPage !== -1 && (
        <Button className="is-primary" component="a" icon="add" onClick={onCreateSubPage}>
          Create sub-page
        </Button>
      )}
    </div>
  );
}

export default PageProperty;
