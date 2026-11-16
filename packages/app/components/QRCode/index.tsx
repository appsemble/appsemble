import { generate } from 'lean-qr';
import { toSvgPath } from 'lean-qr/extras/svg';
import { type ReactNode } from 'react';

interface QRCodeProps {
  /**
   * The width and height of the rendered QR code in pixels.
   */
  readonly size: number;

  /**
   * The text to encode.
   */
  readonly value: string;
}

/**
 * Render a value as a black on white QR code.
 */
export function QRCode({ size, value }: QRCodeProps): ReactNode {
  const code = generate(value);

  return (
    <svg
      height={size}
      shapeRendering="crispEdges"
      viewBox={`0 0 ${code.size} ${code.size}`}
      width={size}
    >
      <rect fill="#fff" height={code.size} width={code.size} />
      <path d={toSvgPath(code)} fill="#000" />
    </svg>
  );
}
