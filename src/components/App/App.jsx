import React from 'react';
import {
  IntlProvider,
} from 'react-intl';


export default class App extends React.Component {
  render() {
    return (
      <IntlProvider
        locale="en-US"
        defaultLocale="en-US"
        textComponent={React.Fragment}
      >
        <div>
          Hello world!
        </div>
      </IntlProvider>
    );
  }
}
