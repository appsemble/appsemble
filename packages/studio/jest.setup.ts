import crypto from 'crypto';
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

// https://github.com/jsdom/jsdom/issues/1612
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues(arr: Uint8Array) {
      return crypto.randomFillSync(arr);
    },
  },
});
