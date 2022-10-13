import { ReactElement } from 'react';

import { GuiEditorTabs } from '../index.js';

interface PagesTabProps {
  tab: GuiEditorTabs;
}
export function PagesTab({ tab }: PagesTabProps): ReactElement {
  return (
    <div>
      <h1>{tab.title}</h1>
    </div>
  );
}
