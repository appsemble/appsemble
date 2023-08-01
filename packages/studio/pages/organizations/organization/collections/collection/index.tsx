import { Loader, Message, MetaSwitch, useData } from '@appsemble/react-components';
import { type AppCollection } from '@appsemble/types';
import { type ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Route, useParams } from 'react-router-dom';

import { IndexPage } from './IndexPage/index.js';
import { messages } from './messages.js';

export function CollectionRoutes(): ReactElement {
  const { collectionId } = useParams<{
    collectionId: string;
  }>();
  const {
    data: collection,
    error,
    loading,
  } = useData<AppCollection>(`/api/appCollections/${collectionId}`);

  if (error) {
    return (
      <Message color="danger">
        {error.response?.status === 404 ? (
          <FormattedMessage {...messages.notFound} />
        ) : error.response?.status === 401 ? (
          <FormattedMessage {...messages.permissionError} />
        ) : (
          <FormattedMessage {...messages.uncaughtError} />
        )}
      </Message>
    );
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <MetaSwitch title={collection?.name}>
      <Route element={<IndexPage collection={collection} />} path="/" />
    </MetaSwitch>
  );
}
