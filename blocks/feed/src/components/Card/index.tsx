import { BlockProps, FormattedMessage, withBlock } from '@appsemble/preact';
import { Location } from '@appsemble/preact-components';
import { Component, createRef, Fragment, h, VNode } from 'preact';

import iconUrl from '../../../../../themes/amsterdam/core/marker.svg';
import type { Remappers } from '../../../block';
import AvatarWrapper from '../AvatarWrapper';
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
  /**
   * Remapper functions that have been prepared by a parent component.
   */
  remappers: Remappers;
}

interface CardState {
  message: string;
  replies: any[];
  valid: boolean;
}

/**
 * A single card in the feed.
 */
class Card extends Component<BlockProps & CardProps, CardState> {
  replyContainer = createRef<HTMLDivElement>();

  state: CardState = {
    message: '',
    replies: [],
    valid: false,
  };

  async componentDidMount(): Promise<void> {
    const { actions, content, parameters } = this.props;
    const parentId = parameters.reply?.parentId ?? 'parentId';

    if (actions.onLoadReply.type !== 'noop') {
      const replies = await actions.onLoadReply.dispatch({
        $filter: `${parentId} eq '${content.id}'`,
      });
      this.setState({ replies });
    }
  }

  onAvatarClick = async (event: Event): Promise<void> => {
    event.preventDefault();
    const { actions, content, onUpdate } = this.props;
    const data = await actions.onAvatarClick.dispatch(content);

    if (data) {
      onUpdate(data);
    }
  };

  onButtonClick = async (event: Event): Promise<void> => {
    event.preventDefault();
    const { actions, content, onUpdate } = this.props;
    const data = await actions.onButtonClick.dispatch(content);

    if (data) {
      onUpdate(data);
    }
  };

  onChange = ({
    currentTarget: { validity, value },
  }: h.JSX.TargetedEvent<HTMLInputElement>): void => {
    this.setState({ message: value, valid: validity.valid });
  };

  onSubmit = (event: Event): void => {
    event.preventDefault();
  };

  onClick = async (): Promise<void> => {
    const { actions, content, messages, parameters, utils } = this.props;
    const { message, replies, valid } = this.state;

    if (!valid) {
      return;
    }

    try {
      const contentField = parameters.reply?.content ?? 'content';
      const parentId = parameters.reply?.parentId ?? 'parentId';

      const result = await actions.onSubmitReply.dispatch({
        [parentId]: content.id,
        [contentField]: message,
      });

      this.setState({
        replies: [...replies, result],
        message: '',
      });

      // Scroll to the bottom of the reply container
      this.replyContainer.current.scrollTop = this.replyContainer.current.scrollHeight;
    } catch (e) {
      utils.showMessage([].concat(messages.replyError.format()).join(''));
    }
  };

  render(): VNode {
    const { actions, content, messages, parameters, remappers, theme, utils } = this.props;
    const { message, replies, valid } = this.state;

    const title: string = remappers.title(content);
    const subtitle: string = remappers.subtitle(content);
    const heading: string = remappers.heading(content);
    const picture: string = remappers.picture(content);
    const description: string = remappers.description(content);
    const latitude: number = remappers.latitude(content);
    const longitude: number = remappers.longitude(content);

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

    return (
      <article className="card mx-2 my-2">
        <div className="card-content">
          <div className={`media ${styles.media}`}>
            <AvatarWrapper action={actions.onAvatarClick} onAvatarClick={this.onAvatarClick}>
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
            <button
              className={`button ${styles.button} mb-4`}
              onClick={this.onButtonClick}
              type="button"
            >
              {parameters.buttonLabel ?? 'Click'}
            </button>
          )}

          {actions.onLoadReply.type !== 'noop' && (
            <Fragment>
              <div ref={this.replyContainer} className={styles.replies}>
                {replies.map((reply) => {
                  const author = remappers.author(reply);
                  const replyContent = remappers.content(reply);
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
              <form className="is-flex py-2 px-0" noValidate onSubmit={this.onSubmit}>
                <input
                  className="input"
                  onChange={this.onChange}
                  placeholder={[].concat(messages.reply.format()).join('')}
                  required
                  value={message}
                />
                {/* onSubmit is not used because of buggy interactions with ShadowDOM, React.
                See: https://github.com/spring-media/react-shadow-dom-retarget-events/issues/13 */}
                <button
                  className={`button ${styles.replyButton} ml-1`}
                  disabled={!valid}
                  onClick={this.onClick}
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
}

export default withBlock<CardProps>(Card);
