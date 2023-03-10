import { getValueByNameSequence } from './getNested.js';

describe('get value by name sequence', () => {
  it('should return value of d', () => {
    const rootValues = {
      a: {
        b: [
          {},
          {
            c: {
              d: 'value of d',
            },
          },
        ],
      },
    };
    const nameSequence = 'a.b.1.c.d';
    const expected = 'value of d';
    expect(getValueByNameSequence(nameSequence, rootValues)).toStrictEqual(expected);
  });
});
