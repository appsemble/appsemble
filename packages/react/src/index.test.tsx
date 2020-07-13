import type { BootstrapParams } from '@appsemble/sdk';
import * as enzyme from 'enzyme';
import React, { ReactElement } from 'react';
import ReactDOM from 'react-dom';
import retargetEvents from 'react-shadow-dom-retarget-events';

import { mount, withBlock } from '.';

jest.mock('react-dom', () => ({
  render: jest.fn(),
}));

jest.mock('react-shadow-dom-retarget-events', () => jest.fn());

let bootstrapParams: BootstrapParams;

beforeEach(() => {
  bootstrapParams = {
    actions: {},
    parameters: {},
    data: {},
    events: {
      emit() {},
      off() {},
      on() {},
    },
    shadowRoot: {
      appendChild(node: HTMLElement) {
        return node;
      },
    } as any,
    utils: {
      remap() {},
      addCleanup() {},
      showMessage() {},
      asset() {
        return '';
      },
    },
    theme: {
      primaryColor: '#ff0000',
      linkColor: '#ff7f00',
      successColor: '#ffff00',
      infoColor: '#00ff00',
      warningColor: '#0000ff',
      dangerColor: '#4b0082',
      splashColor: '#8b00ff',
      themeColor: '#ffffff',
      tileLayer: 'https://cartodb-basemaps-c.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    },
  };
});

describe('mount', () => {
  it('should mount the react component', () => {
    let component: ReactElement;
    (ReactDOM.render as jest.Mock).mockImplementation((c) => {
      component = c;
    });
    mount(() => <div>test</div>, document.createElement('div'))(bootstrapParams);
    expect(enzyme.mount(component)).toMatchSnapshot();
  });

  it('should retarget DOM events to the shadow root', () => {
    mount(() => <div>test</div>, document.createElement('div'))(bootstrapParams);
    expect(retargetEvents).toHaveBeenCalledWith(bootstrapParams.shadowRoot);
  });
});

describe('withBlock', () => {
  it('should pass block props to the child element', () => {
    const Test = withBlock(() => null);
    let component: ReactElement;
    (ReactDOM.render as jest.Mock).mockImplementation((c) => {
      component = c;
    });
    mount(() => <Test />, document.createElement('div'))(bootstrapParams);
    expect(enzyme.mount(component)).toMatchSnapshot();
  });
});
