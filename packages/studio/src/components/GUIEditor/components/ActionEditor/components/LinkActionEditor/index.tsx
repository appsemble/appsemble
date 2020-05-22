import type { App } from '@appsemble/types';
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
  const handleChange = React.useCallback(
    (event, val) => {
      onChange(event, { [event.target.name]: val });
    },
    [onChange],
  );

  return (
    <div>
      <PageSelect app={app} name="to" onChange={handleChange} value={value.to} />
      <UnknownTypeEditor name="parameters" value={value.parameters} />
    </div>
  );
}
