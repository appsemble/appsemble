import React from 'react';
import { shallow } from 'enzyme';

import Message from './Message';

describe('Message', () => {
  it('should render messages', () => {
    const messages = [{ id: 1, body: 'Foo' }, { id: 2, body: 'Bar', color: 'info' }];
    const result = shallow(<Message messages={messages} remove={() => {}} />);

    expect(result).toMatchSnapshot();
  });

  it('should call remove after 5 seconds', () => {
    jest.useFakeTimers();

    const messages = [{ id: 1, body: 'Foo' }, { id: 2, body: 'Bar', color: 'info' }];
    const mock = jest.fn(() => {});
    const result = shallow(<Message messages={[]} remove={mock} />);

    // Simulate adding messages over time
    result.setProps({ messages: [messages[0]] });
    jest.advanceTimersByTime(1000);
    result.setProps({ messages });

    expect(mock.mock.calls).toHaveLength(0);

    jest.advanceTimersByTime(4000);
    expect(mock.mock.calls).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toStrictEqual(messages[0]);

    jest.advanceTimersByTime(1000);
    expect(mock.mock.calls).toHaveLength(2);
    expect(mock.mock.calls[1][0]).toStrictEqual(messages[1]);
  });
});
