import { Button, useMessages } from '@appsemble/react-components';
import { ChangeEvent, ReactElement, useCallback, useState } from 'react';

import { useApp } from '../../../index.js';
import { InputList } from '../../Components/InputList/index.js';
import { InputString } from '../../Components/InputString/index.js';

interface PagePropertyProps {
  selectedPage: number;
}

const pageTypes = ['page', 'flow', 'tabs'] as const;
export function PageProperty({ selectedPage }: PagePropertyProps): ReactElement {
  const { app, setApp } = useApp();
  const push = useMessages();
  const [currentPageName, setCurrentPageName] = useState(
    selectedPage === -1 ? 'Page Name' : app.definition.pages[selectedPage].name,
  );
  const [currentPageType, setCurrentPageType] = useState<(typeof pageTypes)[number]>(
    selectedPage === -1 ? 'page' : app.definition.pages[selectedPage].type || 'page',
  );

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
    if (selectedPage === -1) {
      // Create new page
      if (app.definition.pages.some((page) => page.name === currentPageName)) {
        push({ body: 'Page name already exists', color: 'danger' });
        return;
      }
      if (!currentPageName) {
        push({ body: 'Page name cannot be empty', color: 'danger' });
        return;
      }
      if (currentPageType === 'page') {
        app.definition.pages.push({ name: currentPageName, type: 'page', blocks: [] });
      }
      if (currentPageType === 'flow') {
        app.definition.pages.push({ name: currentPageName, type: 'flow', steps: [] });
      }
      if (currentPageType === 'tabs') {
        app.definition.pages.push({ name: currentPageName, type: 'tabs', tabs: [] });
      }
    } else {
      // Update page
      if (
        app.definition.pages
          .filter((value, index) => index !== selectedPage)
          .some((page) => page.name === currentPageName)
      ) {
        push({ body: 'Page name already exists', color: 'danger' });
        return;
      }
      if (!currentPageName) {
        push({ body: 'Page name cannot be empty', color: 'danger' });
        return;
      }
      app.definition.pages[selectedPage].name = currentPageName;
      app.definition.pages[selectedPage].type = currentPageType;
    }
    setApp({ ...app });
  }, [app, currentPageName, currentPageType, push, selectedPage, setApp]);

  return (
    <div>
      <h4>
        {selectedPage === -1
          ? 'Creating new page...'
          : `Edit page:${app.definition.pages[selectedPage].name}`}
      </h4>
      <InputString label="Name" onChange={onChangePageName} value={currentPageName} />
      <InputList
        label="Type"
        onChange={onChangePageType}
        options={pageTypes}
        value={currentPageType}
      />
      <Button className="is-primary" component="a" icon="add" onClick={onChangePage}>
        {selectedPage === -1 ? 'Create page' : 'Save page'}
      </Button>
    </div>
  );
}

export default PageProperty;
