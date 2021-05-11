import { Content, Loader, Message, useLocationString } from '@appsemble/react-components';
import { AppMessages } from '@appsemble/types';
import {
  defaultLocale,
  detectLocale,
  IntlMessage,
  MessageGetter,
  normalize,
  objectCache,
} from '@appsemble/utils';
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
  getBlockMessage: (
    blockVersion: string,
    blockName: string,
    message: IntlMessage,
    prefix?: string,
  ) => IntlMessageFormat;
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

  const messageCache = useMemo(
    () => objectCache((message) => new IntlMessageFormat(message, lang, undefined, { formatters })),
    [lang],
  );
  const [messages, setMessages] = useState<AppMessages['messages']>();
  const [messagesError, setMessagesError] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(true);

  useEffect(() => {
    const defaultLanguage = definition.defaultLanguage || defaultLocale;
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
    const defaultLanguage = definition.defaultLanguage || defaultLocale;
    if (lang !== defaultLanguage && !languages.includes(lang)) {
      document.documentElement.lang = defaultLocale;
      return;
    }

    document.documentElement.lang = lang;
    axios
      .get<AppMessages>(`${apiUrl}/api/apps/${appId}/messages/${lang}`)
      .then(({ data }) => setMessages(data.messages))
      .catch(() => setMessagesError(true))
      .finally(() => setMessagesLoading(false));
  }, [definition, lang]);

  const getMessage = useCallback(
    ({ defaultMessage, id }: IntlMessage) => {
      const message = Object.hasOwnProperty.call(messages.messageIds, id)
        ? messages.messageIds[id]
        : defaultMessage;
      return messageCache(message || id);
    },
    [messageCache, messages],
  );

  const getBlockMessage = useCallback(
    (blockName: string, blockVersion: string, { id }: IntlMessage, prefix: string) => {
      const message =
        (prefix && messages.app?.[`${prefix}.${id}`]) ||
        messages.blocks?.[blockName]?.[blockVersion]?.[id] ||
        '';
      return messageCache(message);
    },
    [messageCache, messages],
  );

  const value = useMemo(
    () => ({
      getMessage,
      getBlockMessage,
      messageIds: messages?.messageIds ? Object.keys(messages.messageIds) : [],
    }),
    [getMessage, getBlockMessage, messages],
  );

  if (messagesLoading) {
    return <Loader />;
  }

  if (messagesError) {
    return (
      <Content>
        <Message color="danger">There was a problem loading the app.</Message>
      </Content>
    );
  }

  return (
    <Context.Provider value={value}>
      <IntlProvider
        defaultLocale={defaultLocale}
        locale={lang}
        messages={{ ...messages.core, ...messages.app }}
      >
        {children}
      </IntlProvider>
    </Context.Provider>
  );
}

export function useAppMessages(): AppMessageContext {
  return useContext(Context);
}
