import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({
  className = '',
  label,
  options = [],
  placeholder,
  error,
  disabled = false,
  id,
  children,
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
        <select
          id={id}
          disabled={disabled}
          defaultValue=""
          className={`w-full bg-[#0E0E14] border rounded-xl px-4 py-3 text-sm text-text focus:outline-none appearance-none cursor-pointer transition-all ${
            error
              ? 'border-danger/50 focus:border-danger'
              : 'border-white/5 focus:border-primary/50 focus:bg-background'
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-card text-text">
              {opt.label}
            </option>
          ))}
          {children}
        </select>
        <div className="absolute right-3.5 text-gray-500 pointer-events-none">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
      {error && <p className="text-xs text-danger font-medium mt-0.5">{error}</p>}
    </div>
  );
}
