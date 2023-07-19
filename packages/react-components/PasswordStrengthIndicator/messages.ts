import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  required: {
    id: 'react-components.Stbi1f',
    defaultMessage: 'A password is required',
  },
  minLength: {
    id: 'react-components.5J2l4D',
    defaultMessage: 'The password must be at least 8 characters',
  },

  // Warnings
  // https://github.com/zxcvbn-ts/zxcvbn/blob/9e867b7e53ffb09643f3c4bf88fe15db90b16bc0/packages/languages/en/src/translations.ts#L2-L19
  straightRow: {
    id: 'react-components.IyhoMC',
    defaultMessage: 'Straight rows of keys on your keyboard are easy to guess.',
  },
  keyPattern: {
    id: 'react-components.fA/+sb',
    defaultMessage: 'Short keyboard patterns are easy to guess.',
  },
  simpleRepeat: {
    id: 'react-components.d/B425',
    defaultMessage: 'Repeated characters like "aaa" are easy to guess.',
  },
  extendedRepeat: {
    id: 'react-components./sLjsI',
    defaultMessage: 'Repeated character patterns like "abcabcabc" are easy to guess.',
  },
  sequences: {
    id: 'react-components.9KNb6d',
    defaultMessage: 'Common character sequences like "abc" are easy to guess.',
  },
  recentYears: {
    id: 'react-components.48Lr88',
    defaultMessage: 'Recent years are easy to guess.',
  },
  dates: {
    id: 'react-components.HraclQ',
    defaultMessage: 'Dates are easy to guess.',
  },
  topTen: {
    id: 'react-components.1MEbtg',
    defaultMessage: 'This is a heavily used password.',
  },
  topHundred: {
    id: 'react-components.jayEMB',
    defaultMessage: 'This is a frequently used password.',
  },
  common: {
    id: 'react-components.kq/CXH',
    defaultMessage: 'This is a commonly used password.',
  },
  similarToCommon: {
    id: 'react-components.v5Y6yd',
    defaultMessage: 'This is similar to a commonly used password.',
  },
  wordByItself: {
    id: 'react-components.0HiGEo',
    defaultMessage: 'Single words are easy to guess.',
  },
  namesByThemselves: {
    id: 'react-components.w3n6PD',
    defaultMessage: 'Single names or surnames are easy to guess.',
  },
  commonNames: {
    id: 'react-components.RHvmwP',
    defaultMessage: 'Common names and surnames are easy to guess.',
  },
  userInputs: {
    id: 'react-components.jg+sdD',
    defaultMessage: 'There should not be any personal data.',
  },
  // Suggestions
  // https://github.com/zxcvbn-ts/zxcvbn/blob/9e867b7e53ffb09643f3c4bf88fe15db90b16bc0/packages/languages/en/src/translations.ts#L20-L36
  l33t: {
    id: 'react-components.2AETs6',
    defaultMessage: "Avoid predictable letter substitutions like '@' for 'a'.",
  },
  reverseWords: {
    id: 'react-components.AN5uJi',
    defaultMessage: 'Avoid reversed spellings of common words.',
  },
  allUppercase: {
    id: 'react-components.E/9R0H',
    defaultMessage: 'Capitalize some, but not all letters.',
  },
  capitalization: {
    id: 'react-components.Ysf4bT',
    defaultMessage: 'Capitalize more than the first letter.',
  },
  associatedYears: {
    id: 'react-components.tzptOa',
    defaultMessage: 'Avoid years that are associated with you.',
  },
  repeated: {
    id: 'react-components.e+9IqT',
    defaultMessage: 'Avoid repeated words and characters.',
  },
  longerKeyboardPattern: {
    id: 'react-components.YAWiUx',
    defaultMessage: 'Use longer keyboard patterns and change typing direction multiple times.',
  },
  anotherWord: {
    id: 'react-components.XWEM9C',
    defaultMessage: 'Add more words that are less common.',
  },
  useWords: {
    id: 'react-components.tyBIMW',
    defaultMessage: 'Use multiple words, but avoid common phrases.',
  },
  noNeed: {
    id: 'react-components.jOsznl',
    defaultMessage:
      'You can create strong passwords without using symbols, numbers, or uppercase letters.',
  },
  pwned: {
    id: 'react-components.sgyUiJ',
    defaultMessage: 'If you use this password elsewhere, you should change it.',
  },
});
