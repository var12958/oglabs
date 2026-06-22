import React from 'react';

export default function Badge({
  className = '',
  children,
  variant = 'primary',
  ...props
}) {
  const variants = {
    primary: 'bg-primary/10 text-primary border border-primary/20',
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    danger: 'bg-danger/10 text-danger border border-danger/20',
    info: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold select-none ${
        variants[variant] || variants.primary
      } ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
