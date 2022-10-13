import { ReactElement } from 'react';

import { GuiEditorTabs } from '../index.js';

interface ThemeTabProps {
  tab: GuiEditorTabs;
}
export function ThemeTab({ tab }: ThemeTabProps): ReactElement {
  return (
    <div>
      <h1>{tab.title}</h1>
    </div>
  );
}
