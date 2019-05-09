import { BootstrapParams } from '@appsemble/sdk';
import * as enzyme from 'enzyme';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
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
    block: {
      type: 'test',
      version: '0.0.0',
    },
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
      showMessage() {},
    },
  };
});

describe('mount', () => {
  it('should mount the react component', () => {
    let component: JSX.Element;
    (ReactDOM.render as jest.Mock).mockImplementation(c => {
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
    const Test = withBlock(function Test() {
      return null;
    });
    let component: JSX.Element;
    (ReactDOM.render as jest.Mock).mockImplementation(c => {
      component = c;
    });
    mount(() => <Test />, document.createElement('div'))(bootstrapParams);
    expect(enzyme.mount(component)).toMatchSnapshot();
  });
});
