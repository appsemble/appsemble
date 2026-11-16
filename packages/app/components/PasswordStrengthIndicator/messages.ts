import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  required: {
    id: 'app.Stbi1f',
    defaultMessage: 'A password is required',
  },
  minLength: {
    id: 'app.5J2l4D',
    defaultMessage: 'The password must be at least 8 characters',
  },

  // Warnings
  // https://github.com/zxcvbn-ts/zxcvbn/blob/9e867b7e53ffb09643f3c4bf88fe15db90b16bc0/packages/languages/en/src/translations.ts#L2-L19
  straightRow: {
    id: 'app.IyhoMC',
    defaultMessage: 'Straight rows of keys on your keyboard are easy to guess.',
  },
  keyPattern: {
    id: 'app.fA/+sb',
    defaultMessage: 'Short keyboard patterns are easy to guess.',
  },
  simpleRepeat: {
    id: 'app.d/B425',
    defaultMessage: 'Repeated characters like "aaa" are easy to guess.',
  },
  extendedRepeat: {
    id: 'app./sLjsI',
    defaultMessage: 'Repeated character patterns like "abcabcabc" are easy to guess.',
  },
  sequences: {
    id: 'app.9KNb6d',
    defaultMessage: 'Common character sequences like "abc" are easy to guess.',
  },
  recentYears: {
    id: 'app.48Lr88',
    defaultMessage: 'Recent years are easy to guess.',
  },
  dates: {
    id: 'app.HraclQ',
    defaultMessage: 'Dates are easy to guess.',
  },
  topTen: {
    id: 'app.1MEbtg',
    defaultMessage: 'This is a heavily used password.',
  },
  topHundred: {
    id: 'app.jayEMB',
    defaultMessage: 'This is a frequently used password.',
  },
  common: {
    id: 'app.kq/CXH',
    defaultMessage: 'This is a commonly used password.',
  },
  similarToCommon: {
    id: 'app.v5Y6yd',
    defaultMessage: 'This is similar to a commonly used password.',
  },
  wordByItself: {
    id: 'app.0HiGEo',
    defaultMessage: 'Single words are easy to guess.',
  },
  namesByThemselves: {
    id: 'app.w3n6PD',
    defaultMessage: 'Single names or surnames are easy to guess.',
  },
  commonNames: {
    id: 'app.RHvmwP',
    defaultMessage: 'Common names and surnames are easy to guess.',
  },
  userInputs: {
    id: 'app.jg+sdD',
    defaultMessage: 'There should not be any personal data.',
  },
  // Suggestions
  // https://github.com/zxcvbn-ts/zxcvbn/blob/9e867b7e53ffb09643f3c4bf88fe15db90b16bc0/packages/languages/en/src/translations.ts#L20-L36
  l33t: {
    id: 'app.2AETs6',
    defaultMessage: "Avoid predictable letter substitutions like '@' for 'a'.",
  },
  reverseWords: {
    id: 'app.AN5uJi',
    defaultMessage: 'Avoid reversed spellings of common words.',
  },
  allUppercase: {
    id: 'app.E/9R0H',
    defaultMessage: 'Capitalize some, but not all letters.',
  },
  capitalization: {
    id: 'app.Ysf4bT',
    defaultMessage: 'Capitalize more than the first letter.',
  },
  associatedYears: {
    id: 'app.tzptOa',
    defaultMessage: 'Avoid years that are associated with you.',
  },
  repeated: {
    id: 'app.e+9IqT',
    defaultMessage: 'Avoid repeated words and characters.',
  },
  longerKeyboardPattern: {
    id: 'app.YAWiUx',
    defaultMessage: 'Use longer keyboard patterns and change typing direction multiple times.',
  },
  anotherWord: {
    id: 'app.XWEM9C',
    defaultMessage: 'Add more words that are less common.',
  },
  useWords: {
    id: 'app.tyBIMW',
    defaultMessage: 'Use multiple words, but avoid common phrases.',
  },
  noNeed: {
    id: 'app.jOsznl',
    defaultMessage:
      'You can create strong passwords without using symbols, numbers, or uppercase letters.',
  },
  pwned: {
    id: 'app.sgyUiJ',
    defaultMessage: 'If you use this password elsewhere, you should change it.',
  },
});
