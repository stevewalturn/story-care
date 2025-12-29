import type { TextareaHTMLAttributes } from 'react';

type TextareaProps = {
  label?: string;
  error?: string;
  helperText?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({
  label,
  error,
  helperText,
  className = '',
  required,
  ...props
}: TextareaProps) {
  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <textarea
        className={`
          font-sf-pro focus:ring-opacity-20 w-full rounded-[8px] border px-[14px] py-[12px] text-[14px] tracking-[-0.14px]
          text-gray-900 transition-colors
          placeholder:text-[#bfbfbf] focus:border-purple-600 focus:ring-2 focus:ring-purple-600 focus:outline-none
          disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#e4e4e4]'}
          ${className}
        `}
        {...props}
      />
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
