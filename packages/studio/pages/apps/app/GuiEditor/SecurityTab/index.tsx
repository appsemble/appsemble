import { ReactElement } from 'react';

import { GuiEditorTabs } from '../index.js';

interface SecurityTabProps {
  tab: GuiEditorTabs;
}
export function SecurityTab({ tab }: SecurityTabProps): ReactElement {
  return (
    <div>
      <h1>{tab.title}</h1>
    </div>
  );
}
