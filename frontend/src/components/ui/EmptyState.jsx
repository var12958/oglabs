import React from 'react';
import { designTokens } from '../../data/designTokens';

export default function EmptyState({
  className = '',
  icon: Icon,
  title,
  description,
  action,
  ...props
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 bg-card border border-white/5 rounded-2xl max-w-md mx-auto ${className}`}
      {...props}
    >
      {Icon && (
        <div className="p-4 bg-primary/10 rounded-full border border-primary/20 text-primary mb-4">
          <Icon className="h-8 w-8" />
        </div>
      )}
      <h3 className="text-lg font-bold text-text mb-1">{title}</h3>
      <p className="text-sm text-gray-400 max-w-xs mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div className="w-full sm:w-auto flex justify-center">{action}</div>}
    </div>
  );
}
