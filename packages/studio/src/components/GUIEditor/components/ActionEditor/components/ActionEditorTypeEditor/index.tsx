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
    case 'dialog':
    case 'event':
    case 'flow.back':
    case 'flow.next':
    case 'flow.cancel':
    case 'flow.finish':
    case 'log':
    case 'message':
    case 'noop':
    case 'request':
    case 'resource.get':
    case 'resource.query':
    case 'resource.create':
    case 'resource.delete':
    case 'resource.subscription.status':
    case 'resource.subscription.subscribe':
    case 'resource.subscription.toggle':
    case 'resource.subscription.unsubscribe':
    case 'resource.update':
    case 'static':
      return (
        <div>
          <FormattedMessage {...messages.notSupported} />
        </div>
      );
    default:
      return null;
  }
}
