import { shallow } from 'enzyme';
import React from 'react';
import { IntlProvider } from 'react-intl';

import Modal from './Modal';

it('should not render a bulma modal when it is inactive', () => {
  const intlProvider = new IntlProvider({ locale: 'en' }, {});
  const { intl } = intlProvider.getChildContext();
  const wrapper = shallow(
    <Modal intl={intl} isActive={false} onClose={() => {}}>
      test
    </Modal>,
  );
  expect(wrapper).toMatchSnapshot();
});

it('should render a bulma modal when it is active', () => {
  const intlProvider = new IntlProvider({ locale: 'en' }, {});
  const { intl } = intlProvider.getChildContext();
  const wrapper = shallow(
    <Modal intl={intl} isActive onClose={() => {}}>
      test
    </Modal>,
  );
  expect(wrapper).toMatchSnapshot();
});

it('should close the modal when the close button is clicked', () => {
  const intlProvider = new IntlProvider({ locale: 'en' }, {});
  const { intl } = intlProvider.getChildContext();
  const onClose = jest.fn();
  const wrapper = shallow(
    <Modal intl={intl} isActive onClose={onClose}>
      test
    </Modal>,
  );
  wrapper.find('.modal-close').simulate('click');
  expect(onClose).toHaveBeenCalled();
});

it('should close the modal when the background is clicked', () => {
  const intlProvider = new IntlProvider({ locale: 'en' }, {});
  const { intl } = intlProvider.getChildContext();
  const onClose = jest.fn();
  const wrapper = shallow(
    <Modal intl={intl} isActive onClose={onClose}>
      test
    </Modal>,
  );
  wrapper.find('.modal-background').simulate('click');
  expect(onClose).toHaveBeenCalled();
});

it('should close the modal escape is pressed on the background', () => {
  const intlProvider = new IntlProvider({ locale: 'en' }, {});
  const { intl } = intlProvider.getChildContext();
  const onClose = jest.fn();
  const wrapper = shallow(
    <Modal intl={intl} isActive onClose={onClose}>
      test
    </Modal>,
  );
  wrapper.find('.modal-background').simulate('keydown', { key: 'Escape' });
  expect(onClose).toHaveBeenCalled();
});

it('should not close the modal another key is pressed on the background', () => {
  const intlProvider = new IntlProvider({ locale: 'en' }, {});
  const { intl } = intlProvider.getChildContext();
  const onClose = jest.fn();
  const wrapper = shallow(
    <Modal intl={intl} isActive onClose={onClose}>
      test
    </Modal>,
  );
  wrapper.find('.modal-background').simulate('keydown', { key: 'Space' });
  expect(onClose).not.toHaveBeenCalled();
});
