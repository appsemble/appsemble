import { ActionType, App } from '@appsemble/types';
import { NamedEvent } from '@appsemble/web-utils';
import { ReactElement, useCallback } from 'react';

import { ActionEditor } from '../ActionEditor';

interface ActionsEditorProps {
  actions: Record<string, ActionType>;
  app: App;
  onChange: (event: NamedEvent, value?: any) => void;
  value: any;
  name: string;
}

export function ActionsEditor({
  actions,
  app,
  name,
  onChange,
  value,
}: ActionsEditorProps): ReactElement {
  const handleChange = useCallback(
    (event: NamedEvent, val) =>
      onChange({ currentTarget: { name } }, { ...value, [event.currentTarget.name]: val }),
    [name, value, onChange],
  );

  return (
    <div>
      {Object.entries(value || actions).map(([actionName, actionValue]) => (
        <ActionEditor
          actions={actions}
          app={app}
          key={actionName}
          name={actionName}
          onChange={handleChange}
          value={value ? actionValue : value}
        />
      ))}
    </div>
  );
}
