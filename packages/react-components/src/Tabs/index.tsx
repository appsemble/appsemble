import React from 'react';

import Tab from './Tab';

interface TabsProps {
  tabs: {
    disabled: boolean;
    name: string;
    content: React.ReactElement;
  }[];
}

export default function Tabs({ tabs }: TabsProps): React.ReactElement {
  const [activeTab, setActiveTab] = React.useState<string>(tabs[0].name);
  const activeContent = tabs.find((tab) => tab.name === activeTab).content;

  return (
    <>
      <div className="tabs">
        <ul>
          {tabs.map(
            (tab) =>
              !tab.disabled && (
                <Tab
                  key={tab.name}
                  activeTab={activeTab}
                  name={tab.name}
                  onChangeActiveTab={() => setActiveTab(tab.name)}
                />
              ),
          )}
        </ul>
      </div>
      {activeContent}
    </>
  );
}
