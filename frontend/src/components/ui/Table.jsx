import React from 'react';

export default function Table({
  className = '',
  headers = [],
  isEmpty = false,
  emptyStateComponent,
  children,
  ...props
}) {
  return (
    <div className="w-full overflow-x-auto border border-white/5 rounded-2xl bg-card">
      <table className={`w-full border-collapse text-left text-sm ${className}`} {...props}>
        {headers && headers.length > 0 && (
          <thead className="border-b border-white/5 bg-white/[0.01]">
            <tr>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-gray-400"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-white/5">
          {!isEmpty && children}
          {isEmpty && (
            <tr>
              <td colSpan={headers.length || 1} className="px-6 py-12 text-center">
                {emptyStateComponent || (
                  <span className="text-gray-400 text-sm">No data available</span>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function TableRow({ className = '', children, ...props }) {
  return (
    <tr
      className={`hover:bg-white/[0.02] transition-colors ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableCell({ className = '', children, ...props }) {
  return (
    <td className={`px-6 py-4 text-text align-middle whitespace-nowrap ${className}`} {...props}>
      {children}
    </td>
  );
}
