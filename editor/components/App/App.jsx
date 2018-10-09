import { BrowserRouter as Router, Route } from 'react-router-dom';
import React from 'react';

import Editor from '../Editor';

export default class App extends React.Component {
  render() {
    return (
      <Router>
        <Route
          path="/editor/:id"
          render={props => <Editor id={props.match.params.id} {...props} />}
        />
      </Router>
    );
  }
}
