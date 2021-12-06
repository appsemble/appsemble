export {};

declare module '@appsemble/sdk' {
  interface Parameters {
    /**
     * Draws rectangle on the QR found.
     * By drawing on the canvas in which the video-stream is loaded.
     */
    drawQr?: boolean;

    /**
     * Video Element Height
     */
    videoHeight?: number;

    /**
     * Video Element Width
     */
    videoWidth?: number;
  }

  interface EventEmitters {
    /**
     * Event that gets emitted once the qr scanner has identified and resolved a QR code.
     *
     * foundQr event only holds the string of the QR.
     */
    foundQr: never;
  }
}
