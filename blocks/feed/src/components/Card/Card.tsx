import { BlockProps } from '@appsemble/react';
import { Location } from '@appsemble/react-components';
import React from 'react';
import { InjectedIntlProps } from 'react-intl';

import iconUrl from '../../../../../themes/amsterdam/core/marker.svg';
import { BlockActions, BlockParameters, Remappers } from '../../../types';
import styles from './Card.css';
import messages from './messages';

export interface CardProps {
  /**
   * The content for this specific card to render.
   */
  content: {
    id: number;
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
}

/**
 * A single card in the feed.
 */
export default class Card extends React.Component<
  BlockProps<BlockParameters, BlockActions> & InjectedIntlProps & CardProps,
  CardState
> {
  replyContainer = React.createRef<HTMLDivElement>();

  state: CardState = {
    message: '',
    replies: [],
  };

  async componentDidMount(): Promise<void> {
    const { actions, block, content } = this.props;
    const parentId =
      (block.parameters && block.parameters.reply && block.parameters.reply.parentId) || 'parentId';

    const replies = await actions.loadReply.dispatch({ $filter: `${parentId} eq '${content.id}'` });
    this.setState({ replies });
  }

  onAvatarClick: React.MouseEventHandler = async event => {
    event.preventDefault();
    const { actions, content, onUpdate } = this.props;
    const data = await actions.avatarClick.dispatch(content);

    if (data) {
      onUpdate(data);
    }
  };

  onChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    this.setState({ message: event.target.value });
  };

  onSubmit: React.FormEventHandler = event => {
    event.preventDefault();
  };

  onClick = async () => {
    const { actions, block, content, utils, intl } = this.props;
    const { message, replies } = this.state;

    try {
      const contentField =
        (block.parameters && block.parameters.reply && block.parameters.reply.content) || 'content';
      const parentId =
        (block.parameters && block.parameters.reply && block.parameters.reply.parentId) ||
        'parentId';

      const result = await actions.submitReply.dispatch({
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
      utils.showMessage(intl.formatMessage(messages.replyError));
    }
  };

  render(): React.ReactNode {
    const { actions, block, content, intl, remappers } = this.props;
    const { message, replies } = this.state;

    const title = remappers.title(content);
    const subtitle = remappers.subtitle(content);
    const heading = remappers.heading(content);
    const picture = remappers.picture(content);
    const description = remappers.description(content);
    const latitude = remappers.latitude(content);
    const longitude = remappers.longitude(content);

    // XXX: Replace with avatar/icon and a default icon
    const avatarContent = (
      <figure className="image is-48x48">
        <img
          alt={intl.formatMessage(messages.avatar)}
          src="https://bulma.io/images/placeholders/96x96.png"
        />
      </figure>
    );

    return (
      <article className={`card ${styles.root}`}>
        <div className="card-content">
          <div className="media">
            {actions.avatarClick.type === 'link' ? (
              <a
                className={`media-left ${styles.avatar}`}
                href={actions.avatarClick.href()}
                onClick={this.onAvatarClick}
              >
                {avatarContent}
              </a>
            ) : (
              <button
                className={`media-left ${styles.avatar}`}
                onClick={this.onAvatarClick}
                type="button"
              >
                {avatarContent}
              </button>
            )}
            <header className="media-content">
              {title && <h4 className="title is-4 is-marginless">{title}</h4>}
              {subtitle && <h5 className="subtitle is-5 is-marginless">{subtitle}</h5>}
              {heading && <p className="subtitle is-6">{heading}</p>}
            </header>
          </div>
        </div>
        {picture && (
          <div className="card-image">
            <figure className={styles.figure}>
              <img
                alt={title || subtitle || heading || description}
                className={styles.image}
                src={`${block.parameters.pictureBase}/${picture}`}
              />
            </figure>
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
              />
            )}
          </div>
        )}
        <div className="card-content">
          {description && <p className="content">{description}</p>}
          <div ref={this.replyContainer} className={styles.replies}>
            {replies.map(reply => {
              const author = remappers.author(reply);
              const replyContent = remappers.content(reply);
              return (
                <div key={reply.id} className="content">
                  <h6 className="is-marginless">
                    {author || intl.formatMessage(messages.anonymous)}
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
              placeholder={intl.formatMessage(messages.reply)}
              value={message}
            />
            {/* eslint-disable-next-line no-inline-comments */}
            {/* onSubmit is not used because of buggy interactions with ShadowDOM, React.
                See: https://github.com/spring-media/react-shadow-dom-retarget-events/issues/13 */}
            <button className={`button ${styles.replyButton}`} onClick={this.onClick} type="button">
              <span className="icon is-small">
                <i className="fas fa-paper-plane" />
              </span>
            </button>
          </form>
        </div>
      </article>
    );
  }
}
