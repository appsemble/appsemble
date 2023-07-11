import { Button, useMessages } from '@appsemble/react-components';
import {
  type ChangeEvent,
  type MutableRefObject,
  type ReactElement,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { type Document, type Node, type ParsedNode } from 'yaml';

import { InputList } from '../../Components/InputList/index.js';
import { InputString } from '../../Components/InputString/index.js';

interface PagePropertyProps {
  addIn: (path: Iterable<unknown>, value: Node) => void;
  changeIn: (path: Iterable<unknown>, value: Node) => void;
  deletePage: () => void;
  docRef: MutableRefObject<Document<ParsedNode>>;
  selectedPage: number;
}

const pageTypes = ['page', 'flow', 'tabs'] as const;
export function PageProperty({
  addIn,
  changeIn,
  deletePage,
  docRef,
  selectedPage,
}: PagePropertyProps): ReactElement {
  const push = useMessages();
  const [currentPageName, setCurrentPageName] = useState(
    selectedPage === -1
      ? 'Page Name'
      : (docRef.current.getIn(['pages', selectedPage, 'name']) as string).trim(),
  );
  const [currentPageType, setCurrentPageType] = useState<(typeof pageTypes)[number]>('page');

  const onChangePageName = useCallback(
    (event: ChangeEvent<HTMLInputElement>, value: string) => {
      setCurrentPageName(value);
    },
    [setCurrentPageName],
  );

  const onChangePageType = useCallback(
    (index: number) => {
      setCurrentPageType(pageTypes[index]);
    },
    [setCurrentPageType],
  );

  const onChangePage = useCallback(() => {
    const doc = docRef.current;
    if (selectedPage === -1) {
      // Create new page
      if (doc.toJS().pages.some((page: any) => page.name === currentPageName)) {
        push({ body: 'Page name already exists', color: 'danger' });
        return;
      }
      if (!currentPageName) {
        push({ body: 'Page name cannot be empty', color: 'danger' });
        return;
      }
      if (currentPageType === 'page') {
        addIn(['pages'], doc.createNode({ name: currentPageName, blocks: [] }));
      }
      if (currentPageType === 'flow') {
        addIn(['pages'], doc.createNode({ name: currentPageName, type: 'flow', steps: [] }));
      }
      if (currentPageType === 'tabs') {
        addIn(['pages'], doc.createNode({ name: currentPageName, type: 'tabs', tabs: [] }));
      }
    } else {
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
      if (currentPageType !== 'page') {
        changeIn(['pages', selectedPage, 'type'], doc.createNode(currentPageType));
      }
    }
  }, [addIn, changeIn, currentPageName, currentPageType, docRef, push, selectedPage]);

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
        value={currentPageType}
      />
      <Button className="is-primary" component="a" icon="add" onClick={onChangePage}>
        {selectedPage === -1
          ? 'Create page'
          : currentPageType === 'page'
          ? 'Save page'
          : 'Create sub-page'}
      </Button>
    </div>
  );
}

export default PageProperty;
