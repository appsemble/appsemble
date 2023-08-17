import { getAllowedChars, getCheckedString } from './stringValidator.js';

let originalLocation: Location;

beforeEach(() => {
  originalLocation = window.location;
  Object.defineProperty(window, 'location', {
    value: { ...originalLocation },
    writable: true,
  });
});

afterEach(() => {
  window.location = originalLocation;
});

it('test string with all allowed characters', () => {
  const charsRegex = getAllowedChars(true, true, true, true);
  const inputString = 'Test string1?';
  const result = getCheckedString(charsRegex, inputString);
  expect(result).toBe('Test string1?');
});

it('test string with no allowed spaces', () => {
  const charsRegex = getAllowedChars(false, true, true, true);
  const inputString = 'test ';
  const result = getCheckedString(charsRegex, inputString);
  expect(result).toBe('test');
});

it('test string with no allowed upper case characters', () => {
  const charsRegex = getAllowedChars(true, true, true, false);
  const inputString = 'Test';
  const result = getCheckedString(charsRegex, inputString);
  expect(result).toBe('est');
});

it('test string with no allowed symbol characters', () => {
  const charsRegex = getAllowedChars(true, false, true, true);
  const inputString = 'test?';
  const result = getCheckedString(charsRegex, inputString);
  expect(result).toBe('test');
});

it('test string with no allowed number characters', () => {
  const charsRegex = getAllowedChars(true, true, false, true);
  const inputString = 'test1';
  const result = getCheckedString(charsRegex, inputString);
  expect(result).toBe('test');
});
