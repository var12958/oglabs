import React from 'react';

export default function ProgressBar({
  className = '',
  value = 0,
  variant = 'primary',
  showValue = false,
  animated = true,
  ...props
}) {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  const colors = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-amber-500',
    danger: 'bg-danger',
  };

  return (
    <div className={`w-full ${className}`} {...props}>
      {showValue && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-semibold text-gray-400">
          <span>Status</span>
          <span className="text-text">{clampedValue}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden relative">
        <div
          style={{ width: `${clampedValue}%` }}
          className={`h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
            colors[variant] || colors.primary
          } ${animated ? 'progress-shimmer' : ''}`}
        />
      </div>
    </div>
  );
}
