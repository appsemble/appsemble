import {
  Content,
  da as daReactComponentMessages,
  Loader,
  Message,
  nl as nlReactComponentMessages,
  useLocationString,
} from '@appsemble/react-components';
import { AppMessages } from '@appsemble/types';
import { detectLocale, IntlMessage, MessageGetter, normalize, objectCache } from '@appsemble/utils';
import axios from 'axios';
import memoizeIntlConstructor from 'intl-format-cache';
import { IntlMessageFormat } from 'intl-messageformat';
import React, {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { IntlProvider } from 'react-intl';
import { useHistory, useParams } from 'react-router-dom';

import daAppMessages from '../../../translations/da.json';
import nlAppMessages from '../../../translations/nl.json';
import { apiUrl, appId, languages } from '../../utils/settings';
import { useAppDefinition } from '../AppDefinitionProvider';

interface IntlMessagesProviderProps {
  children: ReactNode;
}

interface AppMessageContext {
  getMessage: MessageGetter;
  messageIds: string[];
}

const Context = createContext<AppMessageContext>(null);

const formatters = {
  getNumberFormat: memoizeIntlConstructor(Intl.NumberFormat),
  getDateTimeFormat: memoizeIntlConstructor(Intl.DateTimeFormat),
  getPluralRules: memoizeIntlConstructor(Intl.PluralRules),
};

const providedMessages: Record<string, Record<string, string>> = {
  nl: { ...nlReactComponentMessages, ...nlAppMessages },
  da: { ...daReactComponentMessages, ...daAppMessages },
};

export function AppMessagesProvider({ children }: IntlMessagesProviderProps): ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const { definition } = useAppDefinition();
  const history = useHistory();
  const redirect = useLocationString();

  const [messages, setMessages] = useState<AppMessages['messages']>({});
  const messageCache = useMemo(
    () => objectCache((message) => new IntlMessageFormat(message, lang, undefined, { formatters })),
    [lang],
  );
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const defaultLanguage = definition.defaultLanguage || 'en-us';
    if (lang !== defaultLanguage && !languages.includes(lang)) {
      const preferredLanguage = localStorage.getItem('preferredLanguage');
      const detected =
        (languages.includes(preferredLanguage) && preferredLanguage) ||
        detectLocale(languages, navigator.languages) ||
        defaultLanguage;
      if (/^[A-Z]/.exec(lang) || definition.pages.find((page) => lang === normalize(page.name))) {
        // Someone got linked to a page without a language tag. Redirect them to the same page, but
        // with language set. This is especially important for the OAuth2 callback URL.
        history.replace(`/${detected}${redirect}`);
      } else {
        history.replace(`/${detected}`);
      }
      return;
    }

    axios
      .get<AppMessages>(`${apiUrl}/api/apps/${appId}/messages/${lang}`)
      .then(({ data }) => setMessages(data.messages))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [definition, history, lang, redirect]);

  const getMessage = useCallback(
    ({ defaultMessage, id }: IntlMessage) => {
      const message = Object.hasOwnProperty.call(messages, id) ? messages[id] : defaultMessage;
      return messageCache(message);
    },
    [messageCache, messages],
  );

  const value = useMemo(
    () => ({
      getMessage,
      messageIds: Object.keys(messages),
    }),
    [getMessage, messages],
  );

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Content>
        <Message color="danger">There was a problem loading the app.</Message>
      </Content>
    );
  }

  return (
    <Context.Provider value={value}>
      <IntlProvider defaultLocale="en-US" locale={lang} messages={providedMessages[lang]}>
        {children}
      </IntlProvider>
    </Context.Provider>
  );
}

export function useAppMessages(): AppMessageContext {
  return useContext(Context);
}
