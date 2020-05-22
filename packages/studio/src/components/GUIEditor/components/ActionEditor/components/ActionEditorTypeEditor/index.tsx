import type { Action } from '@appsemble/sdk';
import type { App } from '@appsemble/types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { NamedEvent } from '../../../../../../types';
import LinkActionEditor from '../LinkActionEditor';
import messages from './messages';

interface ActionEditorTypeEditorProps {
  name: string;
  selectedActionType: { [actionName: string]: Action['type'] };
  app: App;
  onChange: (event: NamedEvent, value?: any) => void;
  value: any;
}

export default function ActionEditorTypeEditor({
  app,
  name,
  onChange,
  selectedActionType,
  value,
}: ActionEditorTypeEditorProps): React.ReactElement {
  const handleChange = React.useCallback(
    (event, val) => {
      onChange(event, { [name]: val });
    },
    [name, onChange],
  );

  switch (selectedActionType[name]) {
    case 'link':
      return <LinkActionEditor app={app} onChange={handleChange} value={value[name]} />;
    default:
      return (
        <div>
          <FormattedMessage {...messages.notSupported} />
        </div>
      );
  }
}
