import React from 'react';

interface SaudiRiyalProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

/**
 * Official new Saudi Riyal symbol (issued by SAMA, February 2025).
 * Uses `currentColor` so it inherits text color in any context.
 *
 * The path data is the official glyph published by the Saudi Central Bank.
 * For better legibility at small sizes, render at >= 0.9em alongside text
 * and apply a small downward translate so it sits on the text baseline.
 */
export const SaudiRiyal: React.FC<SaudiRiyalProps> = ({
  size,
  className,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1124.14 1256.39"
    width={size ?? '1em'}
    height={size ?? '1em'}
    fill="currentColor"
    aria-label="Saudi Riyal"
    role="img"
    className={className}
    style={{
      shapeRendering: 'geometricPrecision',
      ...(props.style || {}),
    }}
    {...props}
  >
    <path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z" />
    <path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69L0,793.7c20.06,44.47,33.31,92.75,38.4,143.37l369.31-78.53v176.25c0,87.27-11.69,172.78-33.119,253.6,225.45-56.42,392.825-256.36,392.825-489.6v-18.66l318.314-67.71Z" />
  </svg>
);

export default SaudiRiyal;
