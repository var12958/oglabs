import React from 'react';
import { designTokens } from '../../data/designTokens';

export default function Input({
  className = '',
  label,
  helperText,
  error,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  id,
  type = 'text',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${disabled ? 'opacity-50' : ''}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-gray-400 tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="absolute left-3.5 text-gray-500 pointer-events-none">
            <LeftIcon className="h-4 w-4" />
          </div>
        )}
        <input
          id={id}
          type={type}
          disabled={disabled}
          className={`w-full bg-[#0E0E14] border rounded-xl px-4 py-3 text-sm text-text placeholder-gray-500 focus:outline-none transition-all ${
            LeftIcon ? 'pl-10' : ''
          } ${RightIcon ? 'pr-10' : ''} ${
            error
              ? 'border-danger/50 focus:border-danger'
              : 'border-white/5 focus:border-primary/50 focus:bg-background'
          } ${className}`}
          {...props}
        />
        {RightIcon && (
          <div className="absolute right-3.5 text-gray-500 pointer-events-none">
            <RightIcon className="h-4 w-4" />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-danger font-medium mt-0.5">{error}</p>}
      {!error && helperText && <p className="text-xs text-gray-500 mt-0.5">{helperText}</p>}
    </div>
  );
}
