import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-medium text-[#9ca3af]">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]">
            {icon}
          </span>
        )}
        <input
          className={`input ${icon ? 'pl-8' : ''} ${error ? 'border-[#ef4444] focus:border-[#ef4444]' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-[#ef4444]">{error}</p>}
    </div>
  );
}
