import { Location } from '@appsemble/react-components';
import React from 'react';
import PropTypes from 'prop-types';

import styles from './Card.css';
import messages from './messages';
import iconUrl from '../../../../../themes/amsterdam/core/marker.svg';

/**
 * A single card in the feed.
 */
export default class Card extends React.Component {
  static propTypes = {
    /**
     * The actions as passed by the Appsemble interface.
     */
    actions: PropTypes.shape().isRequired,
    /**
     * The Appsemble block for which to render the card.
     */
    block: PropTypes.shape().isRequired,
    intl: PropTypes.shape().isRequired,
    utils: PropTypes.shape().isRequired,
    /**
     * The content for this specific card to render.
     */
    content: PropTypes.shape().isRequired,
    /**
     * Remapper functions that have been prepared by a parent component.
     */
    remappers: PropTypes.shape().isRequired,
    /**
     * Update function that can be called to update a single resource
     */
    onUpdate: PropTypes.func.isRequired,
  };

  replyContainer = React.createRef();

  state = {
    message: '',
    replies: [],
    valid: false,
  };

  async componentDidMount() {
    const { actions, block, content } = this.props;
    const parentId = block.parameters?.reply?.parentId || 'parentId';

    const replies = await actions.loadReply.dispatch({ $filter: `${parentId} eq '${content.id}'` });
    this.setState({ replies });
  }

  onAvatarClick = async event => {
    event.preventDefault();
    const { actions, content, onUpdate } = this.props;
    const data = await actions.avatarClick.dispatch(content);

    if (data) {
      onUpdate(data);
    }
  };

  onChange = event => {
    this.setState({ message: event.target.value, valid: event.target.validity.valid });
  };

  onSubmit = event => {
    event.preventDefault();
  };

  onClick = async () => {
    const { actions, block, content, utils, intl } = this.props;
    const { message, replies, valid } = this.state;

    if (!valid) {
      return;
    }

    try {
      const contentField = block.parameters?.reply?.content || 'content';
      const parentId = block.parameters?.reply?.parentId || 'parentId';

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

  render() {
    const { actions, block, content, intl, remappers } = this.props;
    const { message, replies, valid } = this.state;

    const title = remappers.title(content);
    const subtitle = remappers.subtitle(content);
    const heading = remappers.heading(content);
    const picture = remappers.picture(content);
    const description = remappers.description(content);
    const latitude = remappers.latitude(content);
    const longitude = remappers.longitude(content);

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

    const AvatarWrapper = ({ children }) =>
      actions.avatarClick.type === 'link' ? (
        <a
          className={`media-left ${styles.avatar}`}
          href={actions.avatarClick.href()}
          onClick={this.onAvatarClick}
        >
          {children}
        </a>
      ) : (
        <button
          className={`media-left ${styles.avatar}`}
          onClick={this.onAvatarClick}
          type="button"
        >
          {children}
        </button>
      );

    return (
      <article className={`card ${styles.root}`}>
        <div className="card-content">
          <div className="media">
            <AvatarWrapper>
              <figure className={`image is-48x48 ${color} ${styles.avatarIcon}`}>
                <span className="icon">
                  <i className={`fas fa-2x fa-${icon}`} />
                </span>
              </figure>
            </AvatarWrapper>
            <header className="media-content">
              {title && <h4 className="title is-4 is-marginless">{title}</h4>}
              {subtitle && <h5 className="subtitle is-5 is-marginless">naar: {subtitle}</h5>}
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
        </div>
      </article>
    );
  }
}
