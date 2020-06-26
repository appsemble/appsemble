import { Select } from '@appsemble/react-components/src';
import type { ActionDefinition } from '@appsemble/types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

interface ActionEditorTypeSelectProps {
  name: string;
  setSelectedActionType: (value: { [actionName: string]: ActionDefinition['type'] }) => void;
  value: string;
}

export default function ActionEditorTypeSelect({
  name,
  setSelectedActionType,
  value,
}: ActionEditorTypeSelectProps): React.ReactElement {
  const actionDefinitions: ActionDefinition['type'][] = [
    'dialog',
    'event',
    'flow.back',
    'flow.cancel',
    'flow.finish',
    'flow.next',
    'link',
    'log',
    'message',
    'noop',
    'request',
    'resource.create',
    'resource.delete',
    'resource.get',
    'resource.query',
    'resource.subscription.status',
    'resource.subscription.subscribe',
    'resource.subscription.toggle',
    'resource.subscription.unsubscribe',
    'resource.update',
    'static',
  ];

  const onChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const actionType = event.target.value as ActionDefinition['type'];
      setSelectedActionType({ [name]: actionType });
    },
    [setSelectedActionType, name],
  );

  return (
    <Select
      label={<FormattedMessage {...messages.actionType} />}
      name={name}
      onChange={onChange}
      value={value}
    >
      <FormattedMessage {...messages.empty} tagName="option" values={{ actionName: name }} />
      {actionDefinitions.map((action: string) => (
        <option key={action} value={action}>
          {action}
        </option>
      ))}
    </Select>
  );
}
