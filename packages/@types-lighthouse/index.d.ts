/**
 * The status of Lighthouse typings is a bit in limbo.
 *
 * https://github.com/GoogleChrome/lighthouse/issues/1773
 */
// eslint-disable-next-line filenames/match-exported
export default function lighthouse(url: string, options: object, config?: object): Promise<any>;
