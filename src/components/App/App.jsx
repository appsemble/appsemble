import React from 'react';
import {
  IntlProvider,
} from 'react-intl';
import {
  CssBaseline,
  MuiThemeProvider,
} from '@material-ui/core';

import TitleBar from '../TitleBar';


export default class App extends React.Component {
  render() {
    return (
      <IntlProvider
        locale="en-US"
        defaultLocale="en-US"
        textComponent={React.Fragment}
      >
        <MuiThemeProvider>
          <CssBaseline />
          <TitleBar />
        </MuiThemeProvider>
      </IntlProvider>
    );
  }
}
