/**
 * The path to a static asset.
 */
declare const file: string;

/**
 * A static SVG asset.
 */
declare module '*.svg' {
  export default file;
}
