import { useBlock } from '@appsemble/preact';
import { Button, Input, isPreactChild, Location } from '@appsemble/preact-components';
import { type IconName } from '@appsemble/sdk';
import { type DivIcon, type Icon } from 'leaflet';
import { type JSX, type VNode } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import styles from './index.module.css';
import { AvatarWrapper } from '../AvatarWrapper/index.js';
import { CardImage } from '../CardImage/index.js';
import { createIcon } from '../utils/createIcon.js';

export interface CardProps {
  /**
   * The content for this specific card to render.
   */
  readonly content: {
    id: number;
    status: string;
    photos: string[];
  };

  /**
   * Update function that can be called to update a single resource
   */
  readonly onUpdate: (data: unknown) => void;
}

/**
 * A single card in the feed.
 */
export function Card({ content, onUpdate }: CardProps): VNode {
  const replyContainer = useRef<HTMLDivElement>();
  const { actions, parameters, theme, utils } = useBlock();
  const [message, setMessage] = useState('');
  const [replies, setReplies] = useState<unknown[]>([]);
  const [valid, setValid] = useState(false);
  const [marker, setMarker] = useState<DivIcon | Icon>(null);

  useEffect(() => {
    createIcon({ parameters, utils }).then(setMarker);
  }, [parameters, utils]);

  useEffect(() => {
    const parentId = parameters.reply?.parentId ?? 'parentId';

    if (replies != null) {
      return;
    }

    if (actions.onLoadReply.type === 'noop') {
      setReplies([]);
    } else {
      // Dispatch loading replies if it’s defined.
      actions.onLoadReply({ $filter: `${parentId} eq '${content.id}'` }).then(setReplies);
    }
  }, [actions, content, parameters, replies, setReplies]);

  const onAvatarClick = useCallback(
    async (event: Event): Promise<void> => {
      event.preventDefault();
      const data = await actions.onAvatarClick(content);

      if (data) {
        onUpdate(data);
      }
    },
    [actions, content, onUpdate],
  );

  const onButtonClick = useCallback(
    async (event: Event): Promise<void> => {
      event.preventDefault();
      const data = await actions.onButtonClick(content);

      if (data) {
        onUpdate(data);
      }
    },
    [actions, content, onUpdate],
  );

  const onChange = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement>, value: string): void => {
      setMessage(value);
      setValid(event.currentTarget.validity.valid);
    },
    [setMessage, setValid],
  );

  const onSubmit = useCallback(
    async (event: Event): Promise<void> => {
      event.preventDefault();

      if (!valid) {
        return;
      }

      try {
        const parentId = parameters.reply?.parentId ?? 'parentId';
        const result = await actions.onSubmitReply({
          [parentId]: content.id,
          content: message,
        });

        setMessage('');
        setReplies([...replies, result]);

        if (replyContainer?.current) {
          // Scroll to the bottom of the reply container
          replyContainer.current.scrollTop = replyContainer.current.scrollHeight;
        }
      } catch {
        utils.showMessage(utils.formatMessage('replyErrorMessage'));
      }
    },
    [actions, content, message, parameters, replies, utils, valid],
  );

  const title = utils.remap(parameters.title, content);
  const subtitle = utils.remap(parameters.subtitle, content);
  const heading = utils.remap(parameters.heading, content);
  const picture = utils.remap(parameters.picture, content);
  const pictures = utils.remap(parameters.pictures, content);
  const description = utils.remap(parameters.description, content);
  const latitude = utils.remap(parameters.marker?.latitude, content);
  const longitude = utils.remap(parameters.marker?.longitude, content);

  if (parameters.pictureBase?.endsWith('/')) {
    parameters.pictureBase = parameters.pictureBase.slice(0, -1);
  }

  let color;
  let icon: IconName;

  // XXX: Standardize this based on app definition
  switch (content?.status) {
    case 'open':
      color = 'has-background-danger';
      icon = 'exclamation';
      break;
    case 'in-behandeling':
      color = 'has-background-warning';
      icon = 'cog';
      break;
    case 'opgelost':
      color = 'has-background-success';
      icon = 'check';
      break;
    default:
      color = '';
      icon = 'user';
  }

  return (
    <article className="card mx-2 my-2">
      <div className="card-content">
        <div className={`media ${styles.media}`}>
          <AvatarWrapper action={actions.onAvatarClick} onAvatarClick={onAvatarClick}>
            <figure className={`image is-48x48 ${color} ${styles.avatarIcon}`}>
              <span className="icon">
                <i className={`${utils.fa(icon)} fa-2x`} />
              </span>
            </figure>
          </AvatarWrapper>
          <header className="media-content">
            {isPreactChild(title) ? <h4 className="title is-4 is-marginless">{title}</h4> : null}
            {isPreactChild(subtitle) ? (
              <h5 className="subtitle is-5 is-marginless">{subtitle}</h5>
            ) : null}
            {isPreactChild(heading) ? <p className="subtitle is-6">{heading}</p> : null}
          </header>
        </div>
      </div>
      <div className="card-image">
        {picture && typeof picture === 'string' ? (
          <CardImage
            alt={(title || subtitle || heading || description) as string}
            src={utils.asset(picture)}
          />
        ) : null}
        {pictures && Array.isArray(pictures) && pictures.length > 1 ? (
          <div className={`${styles.images} px-1 py-1`}>
            {pictures.map((p) => (
              <CardImage
                alt={(title || subtitle || heading || description) as string}
                className="image is-64x64 mx-1 my-1"
                key={p}
                src={p ? utils.asset(p) : ''}
              />
            ))}
          </div>
        ) : null}
        {(latitude && longitude) != null && marker ? (
          <Location
            className={styles.location}
            latitude={latitude as number}
            longitude={longitude as number}
            mapOptions={{
              dragging: false,
              zoomControl: false,
            }}
            marker={marker}
            radius={10}
            theme={theme}
          />
        ) : null}
      </div>
      <div className="card-content px-4 py-4">
        {isPreactChild(description) ? <p className="content">{description}</p> : null}
        {actions.onButtonClick.type !== 'noop' && (
          <Button className={`${styles.button} mb-4`} onClick={onButtonClick}>
            {parameters.buttonLabel ?? 'Click'}
          </Button>
        )}
        {actions.onLoadReply.type !== 'noop' && replies ? (
          <>
            <div className={styles.replies} ref={replyContainer}>
              {replies.map((reply: any) => {
                const author =
                  utils.remap(
                    parameters?.reply?.author ?? [{ prop: '$author' }, { prop: 'name' }],
                    reply,
                  ) || utils.formatMessage('anonymousLabel');
                const replyContent = utils.remap(
                  parameters?.reply?.content ?? [{ prop: 'content' }],
                  reply,
                );

                return (
                  <div className="content" key={reply.id}>
                    <h6 className="is-marginless">{author as string}</h6>
                    <p>{replyContent as string}</p>
                  </div>
                );
              })}
            </div>
            <form className="is-flex py-2 px-0" noValidate onSubmit={onSubmit}>
              <Input
                onChange={onChange}
                placeholder={utils.formatMessage('replyLabel')}
                required
                value={message}
              />
              <Button
                className={`${styles.replyButton} ml-1`}
                disabled={!valid}
                icon="paper-plane"
                type="submit"
              />
            </form>
          </>
        ) : null}
      </div>
    </article>
  );
}
