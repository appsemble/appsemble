import { type BlockDefinition, type PageDefinition } from '@appsemble/lang-sdk';
import { Button, Confirmation, useConfirmation, useMessages } from '@appsemble/react-components';
import {
  type ChangeEvent,
  type MutableRefObject,
  type ReactNode,
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
  readonly saveStack: Document<ParsedNode, true>;
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
  saveStack,
  selectedPage,
  selectedSubPage,
}: PagePropertyProps): ReactNode {
  const push = useMessages();
  const { formatMessage } = useIntl();
  const [currentPageName, setCurrentPageName] = useState(
    selectedPage === -1
      ? formatMessage(messages.pageName)
      : (saveStack.getIn(['pages', selectedPage, 'name']) as string).trim(),
  );
  const [inputPageType, setInputPageType] = useState<string>(
    (saveStack.getIn(['pages', selectedPage, 'type']) as string) ?? 'page',
  );
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
      if (saveStack.toJS().pages.some((page: PageDefinition) => page.name === currentPageName)) {
        push({ body: formatMessage(messages.pageNameExists), color: 'danger' });
        return;
      }
      if (!currentPageName) {
        push({ body: formatMessage(messages.pageNameEmpty), color: 'danger' });
        return;
      }
      // Page type changed
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
        saveStack
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
      const oldName = saveStack.toJS().pages[selectedPage].name.trim();
      if (saveStack.toJS().defaultPage.trim() === oldName) {
        changeIn(['defaultPage'], doc.createNode(currentPageName.trim()));
      }
      changeIn(['pages', selectedPage, 'name'], doc.createNode(currentPageName.trim()));

      // Change page type from page to flow/tab (move blocks into steps/tabs)
      if (inputPageType !== 'page' && !saveStack.getIn(['pages', selectedPage, 'type'])) {
        changeIn(['pages', selectedPage, 'type'], saveStack.createNode(inputPageType));
        const pageBlocks = saveStack.getIn(['pages', selectedPage, 'blocks']);
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
        (saveStack.getIn(['pages', selectedPage, 'type']) === 'flow' ||
          saveStack.getIn(['pages', selectedPage, 'type']) === 'tabs') &&
        inputPageType === 'page'
      ) {
        const subPageBlocks = (
          saveStack.getIn([
            'pages',
            selectedPage,
            saveStack.getIn(['pages', selectedPage, 'type']) === 'flow' ? 'steps' : 'tabs',
          ]) as YAMLSeq
        ).items.flatMap((subPage: any) =>
          subPage.getIn(['blocks']).items.map((block: BlockDefinition) => block),
        );

        const pageName = saveStack.getIn(['pages', selectedPage, 'name']);
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
    saveStack,
    currentPageName,
    inputPageType,
    push,
    formatMessage,
    addIn,
    changeIn,
    deleteIn,
  ]);

  const onCreateSubPage = useCallback(() => {
    onChangePage();
    const doc = docRef.current;
    if (inputPageType === 'flow') {
      addIn(
        ['pages', selectedPage, 'steps'],
        doc.createNode({
          name: `SubPage${
            (saveStack.getIn(['pages', selectedPage, 'steps']) as YAMLSeq).items.length
          }`,
          blocks: [],
        }),
      );
      setCurrentSubPage(
        (saveStack.getIn(['pages', selectedPage, 'steps']) as YAMLSeq).items.length - 1,
      );
    } else {
      addIn(
        ['pages', selectedPage, 'tabs'],
        doc.createNode({
          name: `SubPage${(doc.getIn(['pages', selectedPage, 'tabs']) as YAMLSeq).items.length}`,
          blocks: [],
        }),
      );
      setCurrentSubPage(
        (saveStack.getIn(['pages', selectedPage, 'tabs']) as YAMLSeq).items.length - 1,
      );
    }
  }, [onChangePage, docRef, inputPageType, addIn, selectedPage, saveStack]);

  useEffect(() => {
    setCurrentPageName(
      selectedPage === -1
        ? formatMessage(messages.pageName)
        : (saveStack.getIn(['pages', selectedPage, 'name']) as string).trim(),
    );
  }, [docRef, formatMessage, saveStack, selectedPage]);

  const handleDelete = useConfirmation({
    title: 'Careful!',
    body: 'Do you really want to delete this page?',
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
        <Button
          className="is-primary"
          component="a"
          icon="add"
          onClick={onChangePage}
          style={{ margin: '3px' }}
        >
          {selectedPage === -1
            ? formatMessage(messages.createPage)
            : formatMessage(messages.savePage)}
        </Button>
        {inputPageType !== 'page' && selectedPage !== -1 && (
          <Button
            className="is-primary"
            component="a"
            icon="add"
            onClick={onCreateSubPage}
            style={{ margin: '3px' }}
          >
            {formatMessage(messages.createSubPage)}
          </Button>
        )}
      </Confirmation>
    </div>
  );
}

export default PageProperty;
