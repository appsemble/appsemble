/** @jsx h */
import { HTMLEvent } from '@appsemble/dom-types';
import { BlockProps, FormattedMessage } from '@appsemble/preact';
import { Location } from '@appsemble/preact-components';
import { Component, createRef, Fragment, h, VNode } from 'preact';

import iconUrl from '../../../../../themes/amsterdam/core/marker.svg';
import { BlockActions, BlockParameters, Remappers } from '../../../types';
import AvatarWrapper from '../AvatarWrapper';
import styles from './Card.css';

export interface CardProps {
  /**
   * The content for this specific card to render.
   */
  content: {
    id: number;
    status: string;
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
export default class Card extends Component<
  BlockProps<BlockParameters, BlockActions> & CardProps,
  CardState
> {
  replyContainer = createRef<HTMLDivElement>();

  state: CardState = {
    message: '',
    replies: [],
    valid: false,
  };

  async componentDidMount(): Promise<void> {
    const { actions, block, content } = this.props;
    const parentId =
      (block.parameters && block.parameters.reply && block.parameters.reply.parentId) || 'parentId';

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

  onChange = (event: HTMLEvent<HTMLInputElement>): void => {
    this.setState({ message: event.target.value, valid: event.target.validity.valid });
  };

  onSubmit = (event: Event): void => {
    event.preventDefault();
  };

  onClick = async (): Promise<void> => {
    const { actions, block, content, utils, messages } = this.props;
    const { message, replies, valid } = this.state;

    if (!valid) {
      return;
    }

    try {
      const contentField =
        (block.parameters && block.parameters.reply && block.parameters.reply.content) || 'content';
      const parentId =
        (block.parameters && block.parameters.reply && block.parameters.reply.parentId) ||
        'parentId';

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
      utils.showMessage(messages.replyError.format());
    }
  };

  render(): VNode {
    const { actions, block, content, messages, remappers, theme } = this.props;
    const { message, replies, valid } = this.state;

    const title: string = remappers.title(content);
    const subtitle: string = remappers.subtitle(content);
    const heading: string = remappers.heading(content);
    const picture: string = remappers.picture(content);
    const pictures: string[] = remappers.pictures(content);
    const description: string = remappers.description(content);
    const latitude: number = remappers.latitude(content);
    const longitude: number = remappers.longitude(content);

    let color;
    let icon;

    // XXX: Standardize this based on app definition
    switch (content && content.status) {
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
      <article className={`card ${styles.root}`}>
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
          {picture && (
            <figure className={styles.figure}>
              <img
                alt={title || subtitle || heading || description}
                className={styles.image}
                src={`${block.parameters.pictureBase}/${picture}`}
              />
            </figure>
          )}
          {pictures && pictures.length > 1 && (
            <div className={styles.images}>
              {pictures.map(p => (
                <figure key={p} className={`image is-64x64 ${styles.figure}`}>
                  <img
                    alt={title || subtitle || heading || description}
                    src={`${block.parameters.pictureBase}/${p}`}
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
        <div className={`card-content ${styles.content}`}>
          {description && <p className="content">{description}</p>}
          {actions.onButtonClick.type !== 'noop' && (
            <button
              className={`button ${styles.button}`}
              onClick={this.onButtonClick}
              type="button"
            >
              {block.parameters.buttonLabel || 'Click'}
            </button>
          )}

          {actions.onLoadReply.type !== 'noop' && (
            <Fragment>
              <div ref={this.replyContainer} className={styles.replies}>
                {replies.map(reply => {
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
              <form className={styles.replyForm} noValidate onSubmit={this.onSubmit}>
                <input
                  className="input"
                  onChange={this.onChange}
                  placeholder={messages.reply.format()}
                  required
                  value={message}
                />
                {/* eslint-disable-next-line no-inline-comments */}
                {/* onSubmit is not used because of buggy interactions with ShadowDOM, React.
                See: https://github.com/spring-media/react-shadow-dom-retarget-events/issues/13 */}
                <button
                  className={`button ${styles.replyButton}`}
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
