import { shallow } from 'enzyme';
import React from 'react';

import BlockList from '../BlockList';
import Page from './Page';

beforeEach(() => {
  jest.spyOn(document, 'getElementById').mockReturnValue(document.createElement('link'));
});

it('should render the blocks for a page', () => {
  const page = { name: 'Test Page', blocks: [{}, {}] };
  const app = { pages: [page] };
  const wrapper = shallow(
    <Page
      app={app}
      getBlockDefs={() => {}}
      hasErrors={false}
      history={{}}
      match={{}}
      page={page}
    />,
  );

  expect(wrapper).toMatchSnapshot();
});

it('should call event listeners when an event is emitted', () => {
  const page = { name: 'Test Page', blocks: [{}] };
  const app = { pages: [page] };
  const wrapper = shallow(
    <Page
      app={app}
      getBlockDefs={() => {}}
      hasErrors={false}
      history={{}}
      match={{}}
      page={page}
    />,
  );

  const blockProps = wrapper.find(BlockList).props();
  const spy = jest.fn();
  blockProps.onEvent('test', spy);
  blockProps.emitEvent('test', 'data');
  expect(spy).toHaveBeenCalledWith('data');
});
