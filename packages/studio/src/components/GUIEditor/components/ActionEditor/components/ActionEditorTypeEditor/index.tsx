import type { ActionDefinition, App } from '@appsemble/types';
import React, { ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import type { NamedEvent } from '../../../../../../types';
import LinkActionEditor from '../LinkActionEditor';
import messages from './messages';

interface ActionEditorTypeEditorProps {
  selectedActionType: ActionDefinition['type'];
  app: App;
  onChange: (event: any, value?: any) => void;
  value: any;
}

export default function ActionEditorTypeEditor({
  app,
  onChange,
  selectedActionType,
  value,
}: ActionEditorTypeEditorProps): ReactElement {
  const handleChange = useCallback(
    (event: NamedEvent, val) => {
      const valWithType = { type: selectedActionType, ...val };
      onChange(event, valWithType);
    },
    [onChange, selectedActionType],
  );

  switch (selectedActionType) {
    case 'link':
      return <LinkActionEditor app={app} onChange={handleChange} value={value} />;
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
      return (
        <div>
          <FormattedMessage {...messages.noAction} />
        </div>
      );
  }
}
