import { ReactElement } from 'react';

import { GuiEditorTabs } from '../index.js';

export interface GeneralTabProps {
  tab: GuiEditorTabs;
}
export function GeneralTab({ tab }: GeneralTabProps): ReactElement {
  return (
    <div>
      <h1>{tab.title}</h1>
    </div>
  );
}
