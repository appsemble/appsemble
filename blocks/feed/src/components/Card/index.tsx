import { FormattedMessage, useBlock } from '@appsemble/preact';
import { Location } from '@appsemble/preact-components';
import { Fragment, h, VNode } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import iconUrl from '../../../../../themes/amsterdam/core/marker.svg';
import AvatarWrapper from '../AvatarWrapper';
import createIcon from '../utils/createIcon';
import styles from './index.css';

export interface CardProps {
  /**
   * The content for this specific card to render.
   */
  content: {
    id: number;
    status: string;
    fotos: string[];
  };

  /**
   * Update function that can be called to update a single resource
   */
  onUpdate: (data: any) => void;
}

/**
 * A single card in the feed.
 */
export default function Card({ content, onUpdate }: CardProps): VNode {
  const replyContainer = useRef<HTMLDivElement>();
  const { actions, messages, parameters, theme, utils } = useBlock();
  const [message, setMessage] = useState('');
  const [replies, setReplies] = useState<any[]>(null);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    const parentId = parameters.reply?.parentId ?? 'parentId';

    if (replies !== null) {
      return;
    }

    if (actions.onLoadReply.type !== 'noop') {
      // Dispatch loading replies if it’s defined.
      actions.onLoadReply
        .dispatch({
          $filter: `${parentId} eq '${content.id}'`,
        })
        .then(setReplies);
    } else {
      setReplies([]);
    }
  }, [actions, content, parameters, replies, setReplies]);

  const onAvatarClick = useCallback(
    async (event: Event): Promise<void> => {
      event.preventDefault();
      const data = await actions.onAvatarClick.dispatch(content);

      if (data) {
        onUpdate(data);
      }
    },
    [actions, content, onUpdate],
  );

  const onButtonClick = useCallback(
    async (event: Event): Promise<void> => {
      event.preventDefault();
      const data = await actions.onButtonClick.dispatch(content);

      if (data) {
        onUpdate(data);
      }
    },
    [actions, content, onUpdate],
  );

  const onChange = useCallback(
    ({ currentTarget: { validity, value } }: h.JSX.TargetedEvent<HTMLInputElement>): void => {
      setMessage(value);
      setValid(validity.valid);
    },
    [setMessage, setValid],
  );

  const onSubmit = (event: Event): void => {
    event.preventDefault();
  };

  const onClick = useCallback(async (): Promise<void> => {
    if (!valid) {
      return;
    }

    try {
      // XXX Adjust the logic for this.
      const result = await actions.onSubmitReply.dispatch({
        parentId: content.id,
        content: message,
      });

      setMessage('');
      setReplies([...replies, result]);

      // Scroll to the bottom of the reply container
      replyContainer.current.scrollTop = replyContainer.current.scrollHeight;
    } catch (e) {
      utils.showMessage([].concat(messages.replyError.format()).join(''));
    }
  }, [actions, content, message, messages, replies, setMessage, setReplies, utils, valid]);

  const title = utils.remap(parameters.title, content);
  const subtitle = utils.remap(parameters.subtitle, content);
  const heading = utils.remap(parameters.heading, content);
  const picture = utils.remap(parameters.picture, content);
  const description = utils.remap(parameters.description, content);
  const latitude = utils.remap(parameters.marker.latitude, content);
  const longitude = utils.remap(parameters.marker.longitude, content);

  if (parameters.pictureBase && parameters.pictureBase.endsWith('/')) {
    parameters.pictureBase = parameters.pictureBase.slice(0, -1);
  }

  let color;
  let icon;

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

  createIcon({ parameters, utils });

  return (
    <article className="card mx-2 my-2">
      <div className="card-content">
        <div className={`media ${styles.media}`}>
          <AvatarWrapper action={actions.onAvatarClick} onAvatarClick={onAvatarClick}>
            <figure className={`image is-48x48 ${color} ${styles.avatarIcon}`}>
              <span className="icon">
                <i className={`fas fa-2x fa-${icon}`} />
              </span>
            </figure>
          </AvatarWrapper>
          <header className="media-content">
            {title && <h4 className="title is-4 is-marginless">{title}</h4>}
            {subtitle && <h5 className="subtitle is-5 is-marginless">{subtitle}</h5>}
            {heading && <p className="subtitle is-6">{heading}</p>}
          </header>
        </div>
      </div>
      <div className="card-image">
        {picture && content?.fotos.length === 1 && (
          <figure className={styles.figure}>
            <img
              alt={title || subtitle || heading || description}
              className={styles.image}
              src={`${picture ? `${utils.asset(picture)}` : ''}`}
            />
          </figure>
        )}
        {content?.fotos && content?.fotos.length > 1 && (
          <div className={`${styles.images} px-1 py-1`}>
            {content?.fotos.map((p) => (
              <figure key={p} className={`image is-64x64 mx-1 my-1 ${styles.figure}`}>
                <img
                  alt={title || subtitle || heading || description}
                  src={`${p ? `${utils.asset(p)}` : ''}`}
                />
              </figure>
            ))}
          </div>
        )}
        {(latitude && longitude) != null && (
          <Location
            className={styles.location}
            iconHeight={40}
            iconUrl={iconUrl}
            iconWidth={40}
            latitude={latitude}
            longitude={longitude}
            mapOptions={{
              dragging: false,
              zoomControl: false,
            }}
            theme={theme}
          />
        )}
      </div>
      <div className="card-content px-4 py-4">
        {description && <p className="content">{description}</p>}
        {actions.onButtonClick.type !== 'noop' && (
          <button className={`button ${styles.button} mb-4`} onClick={onButtonClick} type="button">
            {parameters.buttonLabel ?? 'Click'}
          </button>
        )}

        {actions.onLoadReply.type !== 'noop' && (
          <Fragment>
            <div ref={replyContainer} className={styles.replies}>
              {replies.map((reply: any) => {
                const author = utils.remap(parameters?.reply.author ?? [{ prop: 'author' }], reply);
                const replyContent = utils.remap(
                  parameters?.reply.content ?? [{ prop: 'content' }],
                  reply,
                );
                return (
                  <div key={reply.id} className="content">
                    <h6 className="is-marginless">
                      {author || <FormattedMessage id="anonymous" />}
                    </h6>
                    <p>{replyContent}</p>
                  </div>
                );
              })}
            </div>
            <form className="is-flex py-2 px-0" noValidate onSubmit={onSubmit}>
              <input
                className="input"
                onChange={onChange}
                placeholder={[].concat(messages.reply.format()).join('')}
                required
                value={message}
              />
              {/* onSubmit is not used because of buggy interactions with ShadowDOM, React.
              See: https://github.com/spring-media/react-shadow-dom-retarget-events/issues/13 */}
              <button
                className={`button ${styles.replyButton} ml-1`}
                disabled={!valid}
                onClick={onClick}
                type="button"
              >
                <span className="icon is-small">
                  <i className="fas fa-paper-plane" />
                </span>
              </button>
            </form>
          </Fragment>
        )}
      </div>
    </article>
  );
}
