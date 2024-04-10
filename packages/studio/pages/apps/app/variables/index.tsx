import { Button, Content, Title, useData, useMeta, useToggle } from '@appsemble/react-components';
import { type AppConfigEntry } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { VariableItem } from './VariableItem/index.js';
import { VariableModal } from './VariableModal/index.js';
import { AsyncDataView } from '../../../../components/AsyncDataView/index.js';
import { HeaderControl } from '../../../../components/HeaderControl/index.js';
import { useApp } from '../index.js';

const initialVariable: AppConfigEntry = {
  id: 0,
  name: '',
  value: '',
};

export function VariablesPage(): ReactNode {
  useMeta(messages.title);
  const { app } = useApp();
  const modal = useToggle();

  const result = useData<AppConfigEntry[]>(`/api/apps/${app.id}/variables`);
  const { setData: setVariables } = result;

  const onUpdated = useCallback(
    (newVariable: AppConfigEntry, oldVariable: AppConfigEntry) => {
      setVariables((variables) => variables.map((v) => (v === oldVariable ? newVariable : v)));
    },
    [setVariables],
  );

  const create = useCallback(
    async (variable: AppConfigEntry) => {
      const { data } = await axios.post<AppConfigEntry>(`/api/apps/${app.id}/variables`, variable);
      modal.disable();
      setVariables((variables) => [...variables, data]);
    },
    [app, modal, setVariables],
  );

  const onDeleted = useCallback(
    (variable: AppConfigEntry) => {
      setVariables((variables) => variables.filter((v) => v.id !== variable.id));
    },
    [setVariables],
  );

  return (
    <Content>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <div className="mb-3">
        <HeaderControl
          control={
            <Button disabled={app.locked !== 'unlocked'} icon="plus" onClick={modal.enable}>
              <FormattedMessage {...messages.addNew} />
            </Button>
          }
          size={4}
        />
        <AsyncDataView
          emptyMessage={<FormattedMessage {...messages.noVariables} />}
          errorMessage={<FormattedMessage {...messages.error} />}
          loadingMessage={<FormattedMessage {...messages.loading} />}
          result={result}
        >
          {(variables) => (
            <ul>
              {variables.map((variable) => (
                <VariableItem
                  key={variable.id}
                  onDeleted={onDeleted}
                  onUpdated={onUpdated}
                  variable={variable}
                />
              ))}
            </ul>
          )}
        </AsyncDataView>
        <VariableModal onSubmit={create} toggle={modal} variable={initialVariable} />
      </div>
    </Content>
  );
}
