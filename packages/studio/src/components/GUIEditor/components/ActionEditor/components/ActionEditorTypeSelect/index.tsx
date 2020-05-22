import { Select } from '@appsemble/react-components/src';
import type { Action } from '@appsemble/sdk';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

interface ActionEditorTypeSelectProps {
  name: string;
  setSelectedActionType: (value: { [actionName: string]: Action['type'] }) => void;
}

enum ActionTypes {
  DIALOG = 'dialog',
  DIALOGERROR = 'dialog.error',
  DIALOGOK = 'dialog.ok',
  EVENT = 'event',
  FLOWBACK = 'flow.back',
  FLOWCANCEL = 'flow.cancel',
  FLOWFINISH = 'flow.finish',
  FLOWNEXT = 'flow.next',
  NOOP = 'noop',
  STATIC = 'static',
  LINK = 'link',
  LOG = 'log',
  REQUEST = 'request',
  RESOURCECREATE = 'resource.create',
  RESOURCEDELETE = 'resource.delete',
  RESOURCEGET = 'resource.get',
  RESOURCEQUERY = 'resource.query',
  RESOURCEUPDATE = 'resource.update',
  RESOURCESUBSCRIPTIONSUBSCRIBE = 'resource.subscription.subscribe',
  RESOURCESUBSCRIPTIONUPDATE = 'resource.subscription.unsubscribe',
  RESOURCESUBSCRIPTIONTOGGLE = 'resource.subscription.toggle',
  RESOURCESUBSCRIPTIONSTATUS = 'resource.subscription.status',
}

export default function ActionEditorTypeSelect({
  name,
  setSelectedActionType,
}: ActionEditorTypeSelectProps): React.ReactElement {
  interface EnumObject {
    [enumValue: number]: string;
  }

  function getEnumValues(e: EnumObject): string[] {
    return Object.keys(e).map((i: any) => e[i]);
  }

  const onChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const actionType = event.target.value as Action['type'];
      setSelectedActionType({ [name]: actionType });
    },
    [setSelectedActionType, name],
  );

  return (
    <Select label="Type" name={name} onChange={onChange} value={name}>
      <option disabled hidden>
        <FormattedMessage {...messages.empty} />
      </option>
      {getEnumValues(ActionTypes).map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </Select>
  );
}
