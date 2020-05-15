import type {
  BasicPageDefinition,
  FlowPageDefinition,
  TabsPageDefinition,
  UserInfo,
} from '@appsemble/types';
import { shallow } from 'enzyme';
import React from 'react';

import * as AppDefinitionProvider from '../AppDefinitionProvider';
import Page from '.';

jest.mock('events', () => ({
  EventEmitter: class EventEmitter {},
}));

jest.mock('react-router-dom', () => ({
  useLocation: () => ({
    pathname: '/my-page',
    search: '',
    hash: '',
  }),
  useHistory: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('react-intl', () => {
  const reactIntl = jest.requireActual('react-intl');
  const intl = reactIntl.createIntl({
    locale: 'en',
  });

  return {
    ...reactIntl,
    useIntl: () => intl,
  };
});

jest.mock('../UserProvider', () => ({
  useUser: () => ({
    logout: jest.fn(),
    role: null as string,
    userInfo: null as UserInfo,
  }),
}));

beforeEach(() => {
  jest.spyOn(document, 'getElementById').mockReturnValue(document.createElement('link'));
});

it('should render the blocks for a page', () => {
  const page: BasicPageDefinition = {
    name: 'Test Page',
    blocks: [
      { type: 'test', version: '0.0.0' },
      { type: 'test', version: '0.0.0' },
    ],
  };
  jest.spyOn(AppDefinitionProvider, 'useAppDefinition').mockReturnValue({
    revision: 1,
    blockManifests: [],
    definition: {
      defaultPage: 'Test Page',
      pages: [page],
    },
  });
  const wrapper = shallow(<Page page={page} prefix="pages.0" />);

  expect(wrapper).toMatchSnapshot();
});

it('should render tabs pages', () => {
  const page: TabsPageDefinition = {
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
  jest.spyOn(AppDefinitionProvider, 'useAppDefinition').mockReturnValue({
    revision: 1,
    blockManifests: [],
    definition: {
      defaultPage: 'Test Page',
      pages: [page],
    },
  });
  const wrapper = shallow(<Page page={page} prefix="pages.0" />);

  expect(wrapper).toMatchSnapshot();
});

it('should render flow page', () => {
  const page: FlowPageDefinition = {
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
  jest.spyOn(AppDefinitionProvider, 'useAppDefinition').mockReturnValue({
    revision: 1,
    blockManifests: [],
    definition: {
      defaultPage: 'Test Page',
      pages: [page],
    },
  });
  const wrapper = shallow(<Page page={page} prefix="pages.0" />);

  expect(wrapper).toMatchSnapshot();
});
