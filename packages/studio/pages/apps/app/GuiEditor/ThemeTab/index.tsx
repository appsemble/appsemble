import { ReactElement } from 'react';

import { Sidebar } from '../Components/Sidebar/index.js';
import { GuiEditorTabs } from '../index.js';

interface ThemeTabProps {
  tab: GuiEditorTabs;
  isOpenLeft: boolean;
  isOpenRight: boolean;
}
export function ThemeTab({ isOpenLeft, isOpenRight, tab }: ThemeTabProps): ReactElement {
  return (
    <>
      <Sidebar isOpen={isOpenLeft} type="left">
        <span className="text-2xl font-bold">{tab.title}</span>
      </Sidebar>
      <div>{tab.title}</div>
      <Sidebar isOpen={isOpenRight} type="right">
        <span className="text-2xl font-bold">{tab.title}</span>
      </Sidebar>
    </>
  );
}
