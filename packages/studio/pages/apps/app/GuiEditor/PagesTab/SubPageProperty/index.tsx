import { Button, Confirmation, useConfirmation, useMessages } from '@appsemble/react-components';
import {
  type ChangeEvent,
  type MutableRefObject,
  type ReactNode,
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
  readonly saveStack: Document<ParsedNode, true>;
}

export function SubPageProperty({
  changeIn,
  deletePage,
  docRef,
  saveStack,
  selectedPage,
  selectedSubPage,
}: SubPagePropertyProps): ReactNode {
  const push = useMessages();
  const [currentSubPageName, setCurrentSubPageName] = useState<string>(
    (
      saveStack.getIn([
        'pages',
        selectedPage,
        saveStack.getIn(['pages', selectedPage, 'type']) === 'flow' ? 'steps' : 'tabs',
        selectedSubPage,
        'name',
      ]) as string
    )?.trim(),
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
        saveStack.getIn([
          'pages',
          selectedPage,
          saveStack.getIn(['pages', selectedPage, 'type']) === 'flow' ? 'steps' : 'tabs',
          selectedSubPage,
          'name',
        ]) as string
      )?.trim(),
    );
  }, [docRef, saveStack, selectedPage, selectedSubPage]);

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
          saveStack.getIn(['pages', selectedPage, 'type']) === 'flow' ? 'steps' : 'tabs',
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
          saveStack.getIn(['pages', selectedPage, 'type']) === 'flow' ? 'steps' : 'tabs',
          selectedSubPage,
          'name',
        ],
        doc.createNode(currentSubPageName),
      );
    }
  }, [docRef, selectedPage, selectedSubPage, currentSubPageName, changeIn, saveStack, push]);

  const handleDelete = useConfirmation({
    title: 'Careful!',
    body: 'Do you really want to delete this sub-page?',
    cancelLabel: 'No',
    confirmLabel: 'Yes',
    color: 'danger',
    action: () => deletePage(),
  });

  return (
    <div>
      <Confirmation>
        {selectedPage !== -1 && (
          <Button className="is-danger" component="a" icon="trash" onClick={() => handleDelete()}>
            Delete Sub-Page
          </Button>
        )}
        <InputString label="Name" onChange={onChangePageName} value={currentSubPageName} />
        <Button className="is-primary" component="a" icon="add" onClick={onChangePage}>
          Save Sub-Page
        </Button>
      </Confirmation>
    </div>
  );
}

export default SubPageProperty;
