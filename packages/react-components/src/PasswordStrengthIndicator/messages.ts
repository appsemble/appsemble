import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  required: 'A password is required',
  minLength: 'The password must be at least 8 characters',

  // Warnings
  // https://github.com/zxcvbn-ts/zxcvbn/blob/9e867b7e53ffb09643f3c4bf88fe15db90b16bc0/packages/languages/en/src/translations.ts#L2-L19
  straightRow: 'Straight rows of keys on your keyboard are easy to guess.',
  keyPattern: 'Short keyboard patterns are easy to guess.',
  simpleRepeat: 'Repeated characters like "aaa" are easy to guess.',
  extendedRepeat: 'Repeated character patterns like "abcabcabc" are easy to guess.',
  sequences: 'Common character sequences like "abc" are easy to guess.',
  recentYears: 'Recent years are easy to guess.',
  dates: 'Dates are easy to guess.',
  topTen: 'This is a heavily used password.',
  topHundred: 'This is a frequently used password.',
  common: 'This is a commonly used password.',
  similarToCommon: 'This is similar to a commonly used password.',
  wordByItself: 'Single words are easy to guess.',
  namesByThemselves: 'Single names or surnames are easy to guess.',
  commonNames: 'Common names and surnames are easy to guess.',
  userInputs: 'There should not be any personal data.',

  // Suggestions
  // https://github.com/zxcvbn-ts/zxcvbn/blob/9e867b7e53ffb09643f3c4bf88fe15db90b16bc0/packages/languages/en/src/translations.ts#L20-L36
  l33t: "Avoid predictable letter substitutions like '@' for 'a'.",
  reverseWords: 'Avoid reversed spellings of common words.',
  allUppercase: 'Capitalize some, but not all letters.',
  capitalization: 'Capitalize more than the first letter.',
  associatedYears: 'Avoid years that are associated with you.',
  repeated: 'Avoid repeated words and characters.',
  longerKeyboardPattern: 'Use longer keyboard patterns and change typing direction multiple times.',
  anotherWord: 'Add more words that are less common.',
  useWords: 'Use multiple words, but avoid common phrases.',
  noNeed: 'You can create strong passwords without using symbols, numbers, or uppercase letters.',
  pwned: 'If you use this password elsewhere, you should change it.',
});
