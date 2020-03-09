import normalize from './normalize';

const fixtures = {
  Foo: 'foo',
  'A somewhat long sentence.': 'a-somewhat-long-sentence',
  'Ĺòt’s øf wəìŕð ćĥâṙąçṫœ®ş': 'lots-f-wir-characts',
  I___contain_underscores: 'i-contain-underscores',
  'many----hyphens': 'many-hyphens',
  'includes.dot': 'includes-dot',
  'trailing-hyphen-': 'trailing-hyphen',
  '-leading-hyphen': 'leading-hyphen',
};

it.each(Object.entries(fixtures))('should turn “%s” into “%s”', (actual, expected) => {
  const result = normalize(actual);
  expect(result).toBe(expected);
});

it('should have an option to not support a trailing hyphen', () => {
  const result = normalize('trailing-hyphen-', false);
  expect(result).toBe('trailing-hyphen-');
});
