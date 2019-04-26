import React from 'react';
import PropTypes from 'prop-types';

import styles from './Card.css';

const replies = [
  {
    author: 'Me',
    content: 'This news is great!',
  },
  {
    author: 'Someone else',
    content: 'Boo! 😠',
  },
  {
    author: 'Oðinn',
    content: 'Keep up the great work!',
  },
  {
    author: 'Þor',
    content: '🌩🔨',
  },
];

export default class Card extends React.Component {
  static propTypes = {
    block: PropTypes.shape().isRequired,
    content: PropTypes.shape().isRequired,
    remappers: PropTypes.shape().isRequired,
  };

  state = {
    message: '',
  };

  onChange = event => {
    console.log(event.target.value);
    this.setState({ message: event.target.value });
  };

  onSubmit = event => {
    console.log(this.state);
    event.preventDefault();
  };

  render() {
    const { content, block, remappers } = this.props;
    const { message } = this.state;

    const title = remappers.title(content);
    const subtitle = remappers.subtitle(content);
    const heading = remappers.heading(content);
    const picture = remappers.picture(content);
    const description = remappers.description(content);

    return (
      <article className={`card ${styles.root}`}>
        <div className="card-content">
          <div className="media">
            <div className="media-left">
              <figure className="image is-48x48">
                <img alt="Placeholder" src="https://bulma.io/images/placeholders/96x96.png" />
              </figure>
            </div>
            <header className="media-content">
              {title && <h4 className="title is-4 is-marginless">{title}</h4>}
              {subtitle && <h5 className="subtitle is-5 is-marginless">{subtitle}</h5>}
              {heading && <p className="subtitle is-6">{heading}</p>}
            </header>
          </div>
        </div>
        {picture && (
          <div className="card-image">
            <figure className="image is-4by3">
              <img
                alt={title || subtitle || heading || description}
                src={`${block.parameters.pictureBase}/${picture}`}
              />
            </figure>
          </div>
        )}
        <div className="card-content">
          {description && <p className="content">{description}</p>}
          <div className={styles.replies}>
            {replies.map(reply => (
              <div key={`${reply.author}${reply.content}`} className="content">
                <h6 className="is-marginless">{reply.author}</h6>
                <p>{reply.content}</p>
              </div>
            ))}
          </div>
          <form className={styles.replyForm} noValidate onSubmit={this.onSubmit}>
            <input className="input" onChange={this.onChange} value={message} />
            <button className={`button ${styles.replyButton}`} type="submit">
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
