import React from 'react';

interface SaudiRiyalProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

/**
 * Official Saudi Riyal symbol (introduced by SAMA, 2025).
 * Uses currentColor so it inherits text color in any context.
 * Source: Saudi Central Bank (SAMA) official glyph.
 */
export const SaudiRiyal: React.FC<SaudiRiyalProps> = ({ size, className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1256 1256"
    width={size ?? '1em'}
    height={size ?? '1em'}
    fill="currentColor"
    aria-label="Saudi Riyal"
    role="img"
    className={className}
    {...props}
  >
    {/* Top-right horizontal stroke */}
    <path d="M1110 360 L1110 500 L640 600 L640 460 Z" />
    {/* Middle horizontal stroke */}
    <path d="M1110 580 L1110 720 L640 820 L640 680 Z" />
    {/* Left vertical stem (long) */}
    <path d="M380 120 L520 90 L520 900 Q520 1050 380 1110 Q420 980 420 870 L420 150 Z" />
    {/* Right vertical stem (short) */}
    <path d="M640 280 L780 250 L780 760 L640 790 Z" />
    {/* Bottom curved tail connecting left stem */}
    <path d="M150 880 L420 820 L420 960 L180 1010 Z" />
  </svg>
);

export default SaudiRiyal;
