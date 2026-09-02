import React, { useEffect, useRef, ReactNode } from 'react';

export interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'amber' | 'emerald' | 'rose';
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  height?: string | number;
  customSize?: boolean;
  spotlightSize?: number;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const glowColorMap = {
  blue: { base: 222, spread: 40, saturation: 90, lightness: 55 },
  purple: { base: 270, spread: 40, saturation: 85, lightness: 60 },
  green: { base: 145, spread: 40, saturation: 80, lightness: 45 },
  emerald: { base: 155, spread: 40, saturation: 85, lightness: 45 },
  red: { base: 350, spread: 30, saturation: 85, lightness: 55 },
  rose: { base: 345, spread: 35, saturation: 90, lightness: 58 },
  orange: { base: 28, spread: 35, saturation: 95, lightness: 52 },
  amber: { base: 38, spread: 35, saturation: 95, lightness: 50 },
};

const sizeMap = {
  sm: 'w-48 h-64',
  md: 'w-64 h-80',
  lg: 'w-80 h-96',
};

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = '',
  glowColor = 'blue',
  size = 'md',
  width,
  height,
  customSize = true,
  spotlightSize = 260,
  style,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncPointer = (e: PointerEvent) => {
      const { clientX: x, clientY: y } = e;

      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        // Calculate relative position within the card for performance & precision
        const relX = x - rect.left;
        const relY = y - rect.top;
        cardRef.current.style.setProperty('--x', `${relX}px`);
        cardRef.current.style.setProperty('--y', `${relY}px`);
        cardRef.current.style.setProperty('--xp', (x / window.innerWidth).toFixed(2));
      }
    };

    document.addEventListener('pointermove', syncPointer);
    return () => document.removeEventListener('pointermove', syncPointer);
  }, []);

  const config = glowColorMap[glowColor] || glowColorMap.blue;

  const getSizeClasses = () => {
    if (customSize) return '';
    return sizeMap[size];
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      style={{
        '--base': config.base,
        '--spread': config.spread,
        '--saturation': `${config.saturation}%`,
        '--lightness': `${config.lightness}%`,
        '--spotlight-size': `${spotlightSize}px`,
        width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
        ...style,
      } as React.CSSProperties}
      className={`
        group relative rounded-2xl bg-white border border-slate-200/90 shadow-xs transition-all duration-300
        overflow-hidden
        hover:shadow-md hover:border-slate-300
        ${getSizeClasses()}
        ${className}
      `}
    >
      {/* Dynamic Cursor Spotlight Radial Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(
            var(--spotlight-size) circle at var(--x, 50%) var(--y, 50%),
            hsl(var(--base) var(--saturation) var(--lightness) / 0.08),
            transparent 70%
          )`,
        }}
      />

      {/* Dynamic Cursor Spotlight Border Glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          padding: '1px',
          background: `radial-gradient(
            calc(var(--spotlight-size) * 0.8) circle at var(--x, 50%) var(--y, 50%),
            hsl(var(--base) var(--saturation) var(--lightness) / 0.45),
            transparent 70%
          )`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
        }}
      />

      {/* Card Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default GlowCard;
