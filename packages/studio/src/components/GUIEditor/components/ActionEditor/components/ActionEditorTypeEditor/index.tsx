import type { ActionDefinition, App } from '@appsemble/types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { NamedEvent } from '../../../../../../types';
import LinkActionEditor from '../LinkActionEditor';
import messages from './messages';

interface ActionEditorTypeEditorProps {
  name: string;
  selectedActionType: { [actionName: string]: ActionDefinition['type'] };
  app: App;
  onChange: (event: any, value?: any) => void;
  value: any;
}

export default function ActionEditorTypeEditor({
  app,
  name,
  onChange,
  selectedActionType,
  value,
}: ActionEditorTypeEditorProps): React.ReactElement {
  const selectedActionTypeName = selectedActionType[name];

  const handleChange = React.useCallback(
    (event: NamedEvent, val) => {
      const valWithType = { type: selectedActionTypeName, ...val };
      onChange(event, { ...value, [name]: valWithType });
    },
    [name, onChange, selectedActionTypeName, value],
  );

  React.useEffect(() => {
    if (selectedActionTypeName === `No "${name}" action`) {
      onChange({ target: name }, {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedActionTypeName]);

  switch (selectedActionTypeName) {
    case 'link':
      return <LinkActionEditor app={app} onChange={handleChange} value={value[name]} />;
    case `No "${name}" action`:
      return null;
    default:
      return (
        <div>
          <FormattedMessage {...messages.notSupported} />
        </div>
      );
  }
}
