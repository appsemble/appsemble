import type { App, LinkActionDefinition } from '@appsemble/types';
import React from 'react';

import type { NamedEvent } from '../../../../../../types';
import PageSelect from '../PageSelect';
import UnknownTypeEditor from '../UnknownTypeEditor';

interface LinkActionEditorProps {
  app: App;
  value: any;
  onChange: (event: NamedEvent, value?: any) => void;
}

export default function LinkActionEditor({
  app,
  onChange,
  value = {},
}: LinkActionEditorProps): React.ReactElement {
  const linkActionDefinition: (keyof LinkActionDefinition)[] = [
    'to',
    'parameters',
    'base',
    'type',
    'remap',
  ];

  const handleChange = React.useCallback(
    (event, val) => {
      onChange(event, { ...value, [event.target.name]: val });
    },
    [onChange, value],
  );

  return (
    <div>
      {linkActionDefinition.map((key: keyof LinkActionDefinition) => {
        if (key === 'to') {
          return (
            <PageSelect
              key={key}
              app={app}
              name="to"
              onChange={handleChange}
              required
              value={value.to}
            />
          );
        }
        if (key === 'parameters') {
          return (
            <UnknownTypeEditor
              key={key}
              name="parameters"
              onChange={handleChange}
              required={false}
              value={value.parameters}
            />
          );
        }
        return null;
      })}
    </div>
  );
}
