import { Title } from '@appsemble/react-components/src';
import type { ActionDefinition, ActionType, App } from '@appsemble/types';
import React from 'react';

import type { NamedEvent } from '../../../../types';
import ActionEditorTypeEditor from './components/ActionEditorTypeEditor';
import ActionEditorTypeSelect from './components/ActionEditorTypeSelect';
import styles from './index.css';

interface ActionEditorProps {
  actions: { [action: string]: ActionType };
  app: App;
  onChange: (event: NamedEvent, value?: any) => void;
  value: any;
}

export default function ActionEditor({
  actions,
  app,
  onChange,
  value = {},
}: ActionEditorProps): React.ReactElement {
  const [selectedActionType, setSelectedActionType] = React.useState<{
    [actionName: string]: ActionDefinition['type'];
  }>({});

  const handleChange = React.useCallback(
    (event, val) => {
      onChange(event.target.name, val);
    },
    [onChange],
  );

  React.useEffect(() => {
    Object.keys(actions).map((key: string): void => {
      if (value[key] && value[key].type) {
        setSelectedActionType({ [key]: value[key].type });
      }
      return value;
    });
  }, [setSelectedActionType, value, actions]);

  return (
    <div>
      {Object.keys(actions).map((key: string) => (
        <div key={key}>
          <Title className={styles.marginTop} level={5}>
            {key}
          </Title>
          <span className="help">{actions[key].description}</span>
          {!selectedActionType[key] ? (
            <ActionEditorTypeSelect
              name={key}
              setSelectedActionType={setSelectedActionType}
              value={key}
            />
          ) : (
            <>
              <ActionEditorTypeSelect
                name={key}
                setSelectedActionType={setSelectedActionType}
                value={selectedActionType[key]}
              />

              <ActionEditorTypeEditor
                app={app}
                name={key}
                onChange={handleChange}
                selectedActionType={selectedActionType}
                value={value}
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
}
