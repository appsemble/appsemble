declare module '@appsemble/sdk' {
  interface Parameters {
    /**
     * If true, the block will draw a rectangle around the QR code when it’s found.
     *
     * @default false
     */
    drawQr?: boolean;

    /**
     * Video element height
     */
    height?: number;

    /**
     * Video element width
     */
    width?: number;
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
