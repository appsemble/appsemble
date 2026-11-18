import { generate } from 'lean-qr';
import { toSvgPath } from 'lean-qr/extras/svg';
import { type VNode } from 'preact';
import { useMemo } from 'preact/hooks';

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
export function QRCode({ size, value }: QRCodeProps): VNode {
  const code = useMemo(() => generate(value), [value]);
  const path = useMemo(() => toSvgPath(code), [code]);

  return (
    <svg
      height={size}
      shapeRendering="crispEdges"
      viewBox={`0 0 ${code.size} ${code.size}`}
      width={size}
    >
      <rect fill="#fff" height={code.size} width={code.size} />
      <path d={path} fill="#000" />
    </svg>
  );
}
