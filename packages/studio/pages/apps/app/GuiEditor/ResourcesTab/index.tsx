import { ReactElement } from 'react';

import { GuiEditorTabs } from '../index.js';

interface ResourcesTabProps {
  tab: GuiEditorTabs;
}
export function ResourcesTab({ tab }: ResourcesTabProps): ReactElement {
  return (
    <div>
      <h1>{tab.title}</h1>
    </div>
  );
}
