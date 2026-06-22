import React from 'react';

export default function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`bg-white/5 rounded skeleton-pulse ${className}`}
      {...props}
    />
  );
}

export function CardSkeleton({ className = '', ...props }) {
  return (
    <div
      className={`bg-card border border-white/5 rounded-2xl p-6 space-y-4 skeleton-pulse ${className}`}
      {...props}
    >
      <div className="h-6 bg-white/5 rounded-md w-1/3" />
      <div className="space-y-2.5">
        <div className="h-4 bg-white/5 rounded-md w-full" />
        <div className="h-4 bg-white/5 rounded-md w-5/6" />
        <div className="h-4 bg-white/5 rounded-md w-2/3" />
      </div>
      <div className="h-10 bg-white/5 rounded-xl w-full mt-4" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4, className = '', ...props }) {
  return (
    <div className={`w-full overflow-x-auto border border-white/5 rounded-2xl bg-card skeleton-pulse ${className}`} {...props}>
      <div className="w-full">
        {/* Table Head */}
        <div className="border-b border-white/5 bg-white/[0.01] px-6 py-4 flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 bg-white/5 rounded-md flex-1" />
          ))}
        </div>
        {/* Table Body */}
        <div className="divide-y divide-white/5 px-6">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="py-4 flex gap-4">
              {Array.from({ length: cols }).map((_, c) => (
                <div key={c} className="h-4 bg-white/5 rounded-md flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TextSkeleton({ className = '', ...props }) {
  return (
    <div className={`space-y-2.5 skeleton-pulse ${className}`} {...props}>
      <div className="h-4 bg-white/5 rounded-md w-full" />
      <div className="h-4 bg-white/5 rounded-md w-11/12" />
      <div className="h-4 bg-white/5 rounded-md w-4/5" />
    </div>
  );
}
