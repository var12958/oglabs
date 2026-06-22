import React from 'react';
import { designTokens } from '../../data/designTokens';

export default function Card({
  className = '',
  children,
  hover = false,
  ...props
}) {
  return (
    <div
      className={`bg-card border border-white/5 ${designTokens.borderRadius.base} ${
        designTokens.transitions.default
      } ${
        hover
          ? 'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:translate-y-[-2px]'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div
      className={`border-b border-white/5 px-6 py-4 flex items-center justify-between gap-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }) {
  return (
    <h3
      className={`text-lg font-bold text-text tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardSubtitle({ className = '', children, ...props }) {
  return (
    <p
      className={`text-xs text-gray-400 mt-0.5 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardBody({ className = '', children, ...props }) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }) {
  return (
    <div
      className={`border-t border-white/5 px-6 py-4 flex items-center justify-between gap-4 bg-white/[0.01] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
