import React from 'react';

export default function PageHeader({
  className = '',
  title,
  subtitle,
  action,
  ...props
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 ${className}`}
      {...props}
    >
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-text">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
    </div>
  );
}
