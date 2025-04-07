import { type AppConfigEntryGetter } from '@appsemble/lang-sdk';
import { Content, Loader, Message } from '@appsemble/react-components';
import { type AppConfigEntry, type ValueFromProcess } from '@appsemble/types';
import axios from 'axios';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { apiUrl, appId } from '../../utils/settings.js';

type AppVariables = Record<string, ValueFromProcess>;

interface AppVariablesContext {
  variables: AppVariables;
  getVariable: AppConfigEntryGetter;
}

interface AppVariablesProviderProps {
  readonly children: ReactNode;
}

// @ts-expect-error 2345 argument of type is not assignable to parameter of type (strictNullChecks)
const Context = createContext<AppVariablesContext>(null);

export function AppVariablesProvider({ children }: AppVariablesProviderProps): ReactNode {
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [variablesError, setVariablesError] = useState(false);
  const [variablesLoading, setVariablesLoading] = useState(true);

  useEffect(() => {
    axios
      .get<AppConfigEntry[]>(`${apiUrl}/api/apps/${appId}/variables`)
      .then(({ data }) => {
        const parsedVariables: Record<string, ValueFromProcess> = {};
        for (const entry of data) {
          parsedVariables[entry.name] = entry.value;
        }
        setVariables(parsedVariables);
      })
      .catch(() => setVariablesError(true))
      .finally(() => setVariablesLoading(false));
  }, []);

  const getVariable = useCallback((name: string) => variables[name], [variables]);

  const value = useMemo(() => ({ variables, getVariable }), [getVariable, variables]);

  if (variablesLoading) {
    return <Loader />;
  }

  if (variablesError) {
    return (
      <Content>
        <Message color="danger">There was a problem loading the app.</Message>
      </Content>
    );
  }

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAppVariables(): AppVariablesContext {
  return useContext(Context);
}
