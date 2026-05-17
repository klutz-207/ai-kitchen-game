import React from 'react';
import { playSound, unlockSound } from '../services/soundEffects';

const variants = {
  primary: 'bg-tomato text-white border-ink hover:-translate-y-0.5 hover:shadow-[0_7px_0_#2e2a27]',
  mint: 'bg-mint text-ink border-ink hover:-translate-y-0.5 hover:shadow-[0_7px_0_#2e2a27]',
  ghost: 'bg-paper text-ink border-cocoa/40 hover:border-ink hover:bg-cream',
};

export function PixelButton({
  children,
  icon: Icon,
  variant = 'primary',
  className = '',
  onClick,
  onPointerEnter,
  ...props
}) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border-2 px-4 py-2 font-bold shadow-pixel transition disabled:translate-y-1 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none ${variants[variant]} ${className}`}
      onClick={(event) => {
        unlockSound();
        onClick?.(event);
      }}
      onPointerEnter={(event) => {
        if (!props.disabled) playSound('hover');
        onPointerEnter?.(event);
      }}
      {...props}
    >
      {Icon ? <Icon aria-hidden="true" size={18} strokeWidth={2.6} /> : null}
      <span>{children}</span>
    </button>
  );
}
