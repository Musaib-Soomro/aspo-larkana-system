import React from 'react';

export default function FormField({ label, error, required, children, hint }) {
  return (
    <div className="mb-5">
      {label ? (
        <label className="block">
          <span className="block text-[11px] font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider mb-2 ml-1">
            {label}
            {required && <span className="text-primary ml-1.5">*</span>}
          </span>
          {children}
        </label>
      ) : (
        children
      )}
      {hint && !error && <p className="text-[11px] text-gray-400 dark:text-dark-muted mt-2 ml-1 italic">{hint}</p>}
      {error && <p className="text-[11px] text-danger font-bold mt-2 ml-1">{error}</p>}
    </div>
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`input-field ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`input-field cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`input-field resize-y min-h-[100px] ${className}`}
      {...props}
    />
  );
}
