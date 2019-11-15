import { shallow } from 'enzyme';
import React from 'react';

import Message, { UniqueMessage } from './Message';

describe('Message', () => {
  it('should render messages', () => {
    const messages: UniqueMessage[] = [
      { id: 1, body: 'Foo' },
      { id: 2, body: 'Bar', color: 'info' },
    ];
    const result = shallow(<Message messages={messages} remove={() => {}} />);

    expect(result).toMatchSnapshot();
  });

  it('should call remove after 5 seconds', () => {
    jest.useFakeTimers();

    const messages = [
      { id: 1, body: 'Foo' },
      { id: 2, body: 'Bar', color: 'info' },
    ];
    const mock = jest.fn();
    const result = shallow(<Message messages={[]} remove={mock} />);

    // Simulate adding messages over time
    result.setProps({ messages: [messages[0]] });
    jest.advanceTimersByTime(1000);
    result.setProps({ messages });

    expect(mock).not.toHaveBeenCalled();

    jest.advanceTimersByTime(4000);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenLastCalledWith(messages[0]);

    jest.advanceTimersByTime(1000);
    expect(mock).toHaveBeenCalledTimes(2);
    expect(mock).toHaveBeenLastCalledWith(messages[1]);
  });
});
