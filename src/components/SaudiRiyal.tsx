import React from 'react';
import riyalImg from '@/assets/saudi-riyal.png';

interface SaudiRiyalProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: number | string;
}

/**
 * Official new Saudi Riyal symbol (issued by SAMA, February 2025).
 *
 * Renders the official PNG glyph as a CSS mask so it inherits `currentColor`
 * and works correctly in light and dark themes — identical visual to SAMA.
 *
 * Defaults to `1em` so it scales with surrounding text.
 */
export const SaudiRiyal: React.FC<SaudiRiyalProps> = ({
  size,
  className,
  style,
  ...props
}) => {
  const dimension = size ?? '1em';
  return (
    <span
      role="img"
      aria-label="Saudi Riyal"
      className={className}
      style={{
        display: 'inline-block',
        width: dimension,
        height: dimension,
        backgroundColor: 'currentColor',
        WebkitMaskImage: `url(${riyalImg})`,
        maskImage: `url(${riyalImg})`,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        verticalAlign: '-0.125em',
        flexShrink: 0,
        ...style,
      }}
      {...props}
    />
  );
};

export default SaudiRiyal;
