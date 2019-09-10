/**
 * The path to a static asset.
 */
declare const file: string;

/**
 * A static GIF asset.
 */
declare module '*.gif' {
  export default file;
}

/**
 * A static JPEG asset.
 */
declare module '*.jpg' {
  export default file;
}

/**
 * A static PNG asset.
 */
declare module '*.png' {
  export default file;
}

/**
 * A static SVG asset.
 */
declare module '*.svg' {
  export default file;
}
