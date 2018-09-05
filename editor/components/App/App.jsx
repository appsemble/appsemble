import React from 'react';
import styles from './app.css';

export default class App extends React.Component {
  state = {
    recipe: '',
  };

  frame = null;

  onChange = (event) => {
    this.setState({ recipe: event.target.value });
  };

  onSubmit = (event) => {
    event.preventDefault();
  };

  render() {
    const { recipe } = this.state;

    return (
      <div className={styles.editor}>
        <div className={styles.leftPanel}>
          <form onSubmit={this.onSubmit}>
            <div className={styles.editorToolbar}>
              <button type="submit">Save</button>
            </div>
            <textarea className={styles.editor} value={recipe} onChange={this.onChange} />
          </form>
        </div>

        <div className={styles.rightPanel}>
          <iframe title="Appsemble App Preview" ref={(ref) => { this.frame = ref; }} src="/1" />
        </div>
      </div>
    );
  }
}
