import normalize from './normalize';

const fixtures = {
  Foo: 'foo',
  'A somewhat long sentence.': 'a-somewhat-long-sentence',
  'Ĺòt’s øf wəìŕð ćĥâṙąçṫœ®ş': 'lots-f-wir-characts',
  I___contain_underscores: 'i-contain-underscores',
};

describe('normalize', () => {
  Object.entries(fixtures).forEach(([actual, expected]) => {
    it(`should turn “${actual}” into “${expected}”`, () => {
      const result = normalize(actual);
      expect(result).toBe(expected);
    });
  });
});
