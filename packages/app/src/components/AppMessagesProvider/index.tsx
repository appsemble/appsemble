import { Content, Loader, Message, useLocationString } from '@appsemble/react-components';
import { AppMessages } from '@appsemble/types';
import { detectLocale, IntlMessage, MessageGetter, normalize, objectCache } from '@appsemble/utils';
import axios from 'axios';
import memoizeIntlConstructor from 'intl-format-cache';
import { IntlMessageFormat } from 'intl-messageformat';
import {
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

export function AppMessagesProvider({ children }: IntlMessagesProviderProps): ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const { definition } = useAppDefinition();
  const history = useHistory();
  const redirect = useLocationString();

  const [messages, setMessages] = useState<AppMessages['messages']>({});
  const [appsembleMessages, setAppsembleMessages] = useState<AppMessages['messages']>();
  const messageCache = useMemo(
    () => objectCache((message) => new IntlMessageFormat(message, lang, undefined, { formatters })),
    [lang],
  );
  const [messagesError, setMessagesError] = useState(false);
  const [appMessagesError, setAppMessagesError] = useState(false);
  const [appMessagesLoading, setAppMessagesLoading] = useState(true);
  const [appsembleMessagesLoading, setAppsembleMessagesLoading] = useState(true);

  useEffect(() => {
    const defaultLanguage = definition.defaultLanguage || 'en-us';
    if (lang === defaultLanguage || languages.includes(lang)) {
      return;
    }
    const preferredLanguage = localStorage.getItem('preferredLanguage');
    const detected =
      (languages.includes(preferredLanguage) && preferredLanguage) ||
      detectLocale(languages, navigator.languages) ||
      defaultLanguage;
    if (/^[A-Z]/.test(lang) || definition.pages.some((page) => lang === normalize(page.name))) {
      // Someone got linked to a page without a language tag. Redirect them to the same page, but
      // with language set. This is especially important for the OAuth2 callback URL.
      history.replace(`/${detected}${redirect}`);
    } else {
      history.replace(`/${detected}`);
    }
  }, [definition, history, lang, redirect]);

  useEffect(() => {
    axios
      .get<AppMessages>(`${apiUrl}/api/apps/${appId}/messages/${lang}`)
      .then(({ data }) => setMessages(data.messages))
      .catch(() => setMessagesError(true))
      .finally(() => setAppMessagesLoading(false));
  }, [lang]);

  useEffect(() => {
    axios
      .get<AppMessages>(`${apiUrl}/api/messages/${lang}?context=app`)
      .then(({ data }) => setAppsembleMessages(data.messages))
      .catch((error) => {
        if (error?.response?.status === 404) {
          // Set messages to an empty object to fall back to the default messages
          setAppsembleMessages({});
        } else {
          setAppMessagesError(true);
        }
      })
      .finally(() => setAppsembleMessagesLoading(false));
  }, [lang]);

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

  if (appMessagesLoading || appsembleMessagesLoading) {
    return <Loader />;
  }

  if (appMessagesError || messagesError) {
    return (
      <Content>
        <Message color="danger">There was a problem loading the app.</Message>
      </Content>
    );
  }

  return (
    <Context.Provider value={value}>
      <IntlProvider defaultLocale="en-us" locale={lang} messages={appsembleMessages}>
        {children}
      </IntlProvider>
    </Context.Provider>
  );
}

export function useAppMessages(): AppMessageContext {
  return useContext(Context);
}
