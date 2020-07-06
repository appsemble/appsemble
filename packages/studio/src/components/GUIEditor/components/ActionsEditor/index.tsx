import type { ActionType, App } from '@appsemble/types';
import type { NamedEvent } from '@appsemble/web-utils';
import React, { ReactElement, useCallback } from 'react';

import ActionEditor from '../ActionEditor';

interface ActionsEditorProps {
  actions: { [action: string]: ActionType };
  app: App;
  onChange: (event: NamedEvent, value?: any) => void;
  value: any;
  name: string;
}

export default function ActionsEditor({
  actions,
  app,
  name,
  onChange,
  value,
}: ActionsEditorProps): ReactElement {
  const handleChange = useCallback(
    (event: NamedEvent, val) =>
      onChange({ target: { name } }, { ...value, [event.target.name]: val }),
    [name, value, onChange],
  );

  return (
    <div>
      {Object.entries(value || actions).map(([actionName, actionValue]) => (
        <ActionEditor
          key={actionName}
          actions={actions}
          app={app}
          name={actionName}
          onChange={handleChange}
          value={value ? actionValue : value}
        />
      ))}
    </div>
  );
}
