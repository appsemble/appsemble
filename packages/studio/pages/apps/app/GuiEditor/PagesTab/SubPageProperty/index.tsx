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

import { InputString } from '../../Components/InputString/index.js';

interface SubPagePropertyProps {
  readonly changeIn: (path: Iterable<unknown>, value: Node) => void;
  readonly deletePage: () => void;
  readonly docRef: MutableRefObject<Document<ParsedNode>>;
  readonly selectedPage: number;
  readonly selectedSubPage: number;
}

export function SubPageProperty({
  changeIn,
  deletePage,
  docRef,
  selectedPage,
  selectedSubPage,
}: SubPagePropertyProps): ReactElement {
  const push = useMessages();
  const [currentSubPageName, setCurrentSubPageName] = useState<string>(
    (
      docRef.current.getIn([
        'pages',
        selectedPage,
        docRef.current.getIn(['pages', selectedPage, 'type']) === 'flow' ? 'steps' : 'tabs',
        selectedSubPage,
        'name',
      ]) as string
    ).trim(),
  );

  const onChangePageName = useCallback(
    (event: ChangeEvent<HTMLInputElement>, value: string) => {
      setCurrentSubPageName(value);
    },
    [setCurrentSubPageName],
  );

  useEffect(() => {
    setCurrentSubPageName(
      (
        docRef.current.getIn([
          'pages',
          selectedPage,
          docRef.current.getIn(['pages', selectedPage, 'type']) === 'flow' ? 'steps' : 'tabs',
          selectedSubPage,
          'name',
        ]) as string
      ).trim(),
    );
  }, [docRef, selectedPage, selectedSubPage]);

  const onChangePage = useCallback(() => {
    const doc = docRef.current;
    if (selectedPage !== -1 && selectedSubPage !== -1) {
      // Update sub-page
      if (!currentSubPageName) {
        push({ body: 'Sub-Page name cannot be empty', color: 'danger' });
        return;
      }
      changeIn(
        [
          'pages',
          selectedPage,
          docRef.current.getIn(['pages', selectedPage, 'type']) === 'flow' ? 'steps' : 'tabs',
          selectedSubPage,
          'name',
        ],
        doc.createNode(currentSubPageName),
      );
      // When a sub-page is selected
    } else {
      changeIn(
        [
          'pages',
          selectedPage,
          docRef.current.getIn(['pages', selectedPage, 'type']) === 'flow' ? 'steps' : 'tabs',
          selectedSubPage,
          'name',
        ],
        doc.createNode(currentSubPageName),
      );
    }
  }, [docRef, selectedPage, selectedSubPage, currentSubPageName, changeIn, push]);

  return (
    <div>
      {selectedPage !== -1 && (
        <Button className="is-danger" component="a" icon="trash" onClick={() => deletePage()}>
          Delete Sub-Page
        </Button>
      )}
      <InputString label="Name" onChange={onChangePageName} value={currentSubPageName} />
      <Button className="is-primary" component="a" icon="add" onClick={onChangePage}>
        Save Sub-Page
      </Button>
    </div>
  );
}

export default SubPageProperty;
