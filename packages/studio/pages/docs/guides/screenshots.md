# App screenshots

In Appsemble, apps can have screenshots, which are visible in the app page in the Appsemble studio.

Screenshots for the app can be defined in the `screenshots` directory of the app directory or can be
created from the app page in the Appsemble studio.

## Table of Contents

- [Screenshots by language](#screenshots-by-language)
- [Ordering screenshots](#ordering-screenshots)

## Screenshots by language

Screenshots can be organized by language by creating subdirectories for each language in the
`screenshots` directory (e.g. `/screenshots/nl`). The language for screenshots defined directly in
the `screenshots` directory, will be considered `unspecified`. For a language to be supported in an
app, a translations JSON file (e.g. `nl.json`) for that language must be present in the `i18n`
directory of the app. If there are no translations for that language, the translation file could
contain an empty JSON object like `{}`.

When visiting the app page in the studio, app screenshots for the user’s preferred language will be
shown. There are the following cases for displaying app screenshots, listed by precedence:

If the user has selected a language other than English, for example Dutch:

- If the app has Dutch screenshots, they will be displayed
- If the app doesn’t have Dutch screenshots and has `unspecified` screenshots, only `unspecified`
  screenshots will be displayed
- If the app doesn’t have neither Dutch, nor `unspecified` screenshots, English screenshots will be
  displayed
- If the app doesn’t have any of the screenshots above, no screenshots will be displayed

Users can also add new app screenshots from the Appsemble studio. The following cases apply when
doing so.

If the user has selected a language other than English, for example Dutch:

- If the app already has any Dutch screenshots, a new Dutch screenshot will be added to the app
- If the app doesn’t have Dutch screenshots and has `unspecified` screenshots, a new `unspecified`
  screenshot will be added to the app
- If the app doesn’t have Dutch screenshots and doesn’t have `unspecified` screenshots, a new Dutch
  screenshot will be added to the app

## Ordering screenshots

To keep a nice order of screenshots in the app page in the Appsemble studio, Appsemble supports
ordering the app screenshots by the name of the screenshot file. Screenshots added from the studio
will always be added at the end of the screenshot list. Screenshots order persists based on the
screenshot language.
