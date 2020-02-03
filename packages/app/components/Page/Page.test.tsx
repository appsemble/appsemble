import { BasicPage, FlowPage, TabsPage } from '@appsemble/types';
import { shallow } from 'enzyme';
import React from 'react';

import Page from './Page';

jest.mock('react-router-dom', () => ({
  useHistory: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('react-intl', () => {
  const reactIntl = require.requireActual('react-intl');
  const intl = reactIntl.createIntl({
    locale: 'en',
  });

  return {
    ...reactIntl,
    useIntl: () => intl,
  };
});

beforeEach(() => {
  jest.spyOn(document, 'getElementById').mockReturnValue(document.createElement('link'));
});

it('should render the blocks for a page', () => {
  const page: BasicPage = {
    name: 'Test Page',
    blocks: [
      { type: 'test', version: '0.0.0' },
      { type: 'test', version: '0.0.0' },
    ],
  };
  const wrapper = shallow(<Page page={page} />);

  expect(wrapper).toMatchSnapshot();
});

it('should render tabs pages', () => {
  const page: TabsPage = {
    name: 'Test Page',
    type: 'tabs',
    subPages: [
      {
        name: 'Sub A',
        blocks: [
          { type: 'test', version: '0.0.0' },
          { type: 'test', version: '0.0.0' },
        ],
      },
      {
        name: 'Sub B',
        blocks: [
          { type: 'test', version: '0.0.0' },
          { type: 'test', version: '0.0.0' },
        ],
      },
    ],
  };
  const wrapper = shallow(<Page page={page} />);

  expect(wrapper).toMatchSnapshot();
});

it('should render flow page', () => {
  const page: FlowPage = {
    name: 'Test Page',
    type: 'flow',
    subPages: [
      {
        name: 'Sub A',
        blocks: [
          { type: 'test', version: '0.0.0' },
          { type: 'test', version: '0.0.0' },
        ],
      },
      {
        name: 'Sub B',
        blocks: [
          { type: 'test', version: '0.0.0' },
          { type: 'test', version: '0.0.0' },
        ],
      },
    ],
  };
  const wrapper = shallow(<Page page={page} />);

  expect(wrapper).toMatchSnapshot();
});
