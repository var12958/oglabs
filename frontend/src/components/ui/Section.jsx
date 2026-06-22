import React from 'react';

export default function Section({
  className = '',
  title,
  subtitle,
  children,
  ...props
}) {
  return (
    <section className={`space-y-4 ${className}`} {...props}>
      {(title || subtitle) && (
        <div className="space-y-1">
          {title && <h2 className="text-xl font-bold tracking-tight text-text">{title}</h2>}
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>
      )}
      <div className="w-full">{children}</div>
    </section>
  );
}
