import { Content, Loader, Message } from '@appsemble/react-components';
import axios from 'axios';
import React, { ReactElement, ReactNode, useEffect, useState } from 'react';
import { IntlProvider } from 'react-intl';
import { useParams } from 'react-router-dom';

import settings from '../../utils/settings';

const languages = ['en', 'nl', 'en-US'];

interface Messages {
  [id: string]: string;
}

interface IntlMessagesProviderProps {
  children: ReactNode;
}

export default function IntlMessagesProvider({
  children,
}: IntlMessagesProviderProps): ReactElement {
  const { lang } = useParams<{ lang: string }>();

  const [messages, setMessages] = useState<Messages>();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lang) {
      return;
    }

    axios
      .get<Messages>(`/api/apps/${settings.id}/messages/${lang}`)
      .then(({ data }) => setMessages(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [lang]);

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
    <IntlProvider defaultLocale="en-US" locale={locale} messages={messages}>
      {children}
    </IntlProvider>
  );
}
