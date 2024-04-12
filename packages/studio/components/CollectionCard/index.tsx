import { Button, Icon, Subtitle, Title } from '@appsemble/react-components';
import { type AppCollection } from '@appsemble/types';
import { type MouseEvent, type ReactNode, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';

interface CollectionCardProps {
  /**
   * The collection to render a card for.
   */
  readonly collection: AppCollection;

  /**
   * Whether the user can edit the collection.
   */
  readonly canEdit: boolean;

  /**
   * Whether the user can delete the collection.
   */
  readonly canDelete: boolean;

  /**
   * Callback to delete the collection.
   */
  readonly onDelete: () => void;

  /**
   * Callback to edit the collection.
   */
  readonly onEdit: () => void;
}

export function CollectionCard({
  canDelete,
  canEdit,
  collection,
  onDelete,
  onEdit,
}: CollectionCardProps): ReactNode {
  const { formatMessage } = useIntl();

  const deleteCollection = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDelete();
    },
    [onDelete],
  );

  const editCollection = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onEdit();
    },
    [onEdit],
  );

  return (
    <Link title={collection.name} to={`../../../collections/${collection.id}`}>
      <div className="m-2 card card-content is-flex">
        <div className="media">
          <figure className={`image is-128x128 is-flex is-clipped is-rounded ${styles.figure}`}>
            <img
              alt={collection.name}
              className={`card ${styles.image}`}
              src={collection.headerImage}
            />
          </figure>
        </div>
        <div className="ml-3">
          <Title className={`${styles.ellipsis} ${styles.title}`} size={5}>
            {collection.name}
          </Title>
          <Subtitle className={`mb-0 ${styles.ellipsis}`} size={6}>
            {collection.$expert.name}
          </Subtitle>
        </div>
        <div className="ml-auto is-flex is-flex-direction-column is-justify-content-center">
          {canEdit ? (
            <Button
              className="m-2"
              onClick={editCollection}
              title={formatMessage(messages.edit)}
              type="button"
            >
              <Icon icon="edit" />
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              className="m-2"
              onClick={deleteCollection}
              title={formatMessage(messages.delete)}
              type="button"
            >
              <Icon className="has-text-danger" icon="trash" />
            </Button>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
