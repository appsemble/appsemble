import intl from 'intl-messageformat';

export type IntlMessageFormat = intl;
// @ts-expect-error Remove if the intl-message format types are fixed upstream
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const IntlMessageFormat = (intl.IntlMessageFormat || intl) as typeof intl;
