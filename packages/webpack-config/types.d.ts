/**
 * A CSS module.
 */
declare const cssModule: Record<string, string>;

/**
 * The filename of a static asset.
 */
declare const filename: string;

/**
 * A CSS module.
 */
declare module '*.module.css' {
  export default cssModule;
}

/**
 * A CSS regular CSS file.
 *
 * In order to use a CSS module, rename the file to `*.module.css`.
 */
declare module '*.css' {
  export {};
}

/**
 * A static GIF image.
 */
declare module '*.gif' {
  export default filename;
}

/**
 * A static JPEG image.
 */
declare module '*.jpeg' {
  export default filename;
}

/**
 * A static JPEG image.
 */
declare module '*.jpg' {
  export default filename;
}

/**
 * A static PNG image.
 */
declare module '*.png' {
  export default filename;
}

/**
 * A static SVG image.
 */
declare module '*.svg' {
  export default filename;
}

/**
 * A static WOFF file.
 */
declare module '*.woff' {
  export default filename;
}

/**
 * A static WOFF2 file.
 */
declare module '*.woff2' {
  export default filename;
}
