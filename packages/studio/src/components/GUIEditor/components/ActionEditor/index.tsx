import { Title } from '@appsemble/react-components/src';
import type { ActionType, App } from '@appsemble/types';
import type { NamedEvent } from '@appsemble/web-utils';
import React, { ReactElement, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import ActionEditorTypeEditor from './components/ActionEditorTypeEditor';
import ActionEditorTypeSelect from './components/ActionEditorTypeSelect';
import messages from './messages';

interface ActionEditorProps {
  actions: { [action: string]: ActionType };
  app: App;
  onChange: (event: NamedEvent, value?: any) => void;
  value: any;
  name: string;
}

export default function ActionEditor({
  actions,
  app,
  name,
  onChange,
  value,
}: ActionEditorProps): ReactElement {
  const [selectedActionType, setSelectedActionType] = useState(value?.type);

  const handleChange = useCallback(
    (_event: NamedEvent, val) => {
      onChange({ currentTarget: { name } }, val);
    },
    [name, onChange],
  );

  return (
    <div>
      <div className="is-flex">
        <Title level={3}>{name}</Title>
        {actions[name].required || (
          <span>
            (<FormattedMessage {...messages.optional} />)
          </span>
        )}
      </div>
      <span className="help">{actions[name]?.description}</span>
      <ActionEditorTypeSelect onChange={setSelectedActionType} value={selectedActionType} />
      {selectedActionType && (
        <ActionEditorTypeEditor
          app={app}
          onChange={handleChange}
          selectedActionType={selectedActionType}
          value={value}
        />
      )}
    </div>
  );
}
