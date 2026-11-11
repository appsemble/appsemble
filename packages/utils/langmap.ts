import langs, { type LanguageMappingList } from 'langmap';

import { has } from './miscellaneous.js';

// Exclude languages that aren’t accepted by our server and store language codes in lowercase.
const bannedLanguages = new Set([
  'ck-US',
  'en-PI',
  'en-UD',
  'en@pirate',
  'eo-EO',
  'fb-LT',
  'gx-GR',
]);

export const langmap: LanguageMappingList = Object.fromEntries(
  Object.entries(langs)
    .filter(([key]) => !bannedLanguages.has(key))
    .map(([key, entry]) => [key.toLowerCase(), entry]),
);

export function getLanguageDisplayName(language: string): string {
  // An app may be translated into any BCP 47 language, including ones langmap does not list.
  if (!has(langmap, language)) {
    return new Intl.DisplayNames('en', { type: 'language' }).of(language)!;
  }
  const { englishName, nativeName } = langmap[language];
  return englishName === nativeName ? englishName : `${englishName} (${nativeName})`;
}
