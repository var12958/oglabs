import React from 'react';
import { Loader2 } from 'lucide-react';
import { designTokens } from '../../data/designTokens';

export default function Button({
  className = '',
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  ...props
}) {
  const variants = {
    primary: 'bg-primary text-text hover:bg-primary/90 border border-primary/10 shadow-md shadow-primary/25',
    secondary: 'bg-white/5 text-text hover:bg-white/10 border border-white/5',
    outline: 'bg-transparent border border-white/10 text-gray-300 hover:text-text hover:border-white/20',
    success: 'bg-success text-text hover:bg-success/90 border border-success/10 shadow-md shadow-success/25',
    danger: 'bg-danger text-text hover:bg-danger/90 border border-danger/10 shadow-md shadow-danger/25',
    ghost: 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-text border border-transparent',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-7 py-3.5 text-base rounded-2xl gap-2.5',
  };

  const isBtnDisabled = disabled || loading;

  return (
    <button
      disabled={isBtnDisabled}
      className={`inline-flex items-center justify-center font-semibold tracking-wide cursor-pointer select-none active:scale-[0.98] ${
        designTokens.transitions.default
      } ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${
        isBtnDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none active:scale-100' : ''
      } ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
      {!loading && LeftIcon && <LeftIcon className="h-4 w-4 shrink-0" />}
      {children}
      {!loading && RightIcon && <RightIcon className="h-4 w-4 shrink-0" />}
    </button>
  );
}
