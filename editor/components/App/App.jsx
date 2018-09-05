import yaml from 'js-yaml';
import React from 'react';
import styles from './app.css';

export default class App extends React.Component {
  state = {
    recipe: '',
    valid: true,
  };

  frame = null;

  onChange = (event) => {
    this.setState({ recipe: event.target.value });
  };

  onSubmit = (event) => {
    event.preventDefault();
    const { recipe } = this.state;
    let json = null;

    // Attempt to parse the YAML into a JSON object
    try {
      json = yaml.safeLoad(recipe);
    } catch (e) {
      console.log(e);
      this.setState({ valid: false });

      return;
    }

    // Assuming the YAML is valid
    this.setState({ valid: true });

    console.log(json);
  };

  render() {
    const { recipe, valid } = this.state;

    return (
      <div className={styles.editor}>
        <div className={styles.leftPanel}>
          <form onSubmit={this.onSubmit}>
            <div className={styles.editorToolbar}>
              <button type="submit">Save</button>
              { !valid
                && <p className={styles.editorError}>Invalid YAML</p>
              }
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
