import type { InputHTMLAttributes } from 'react';

type InputProps = {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ ref, label, error, helperText, leftIcon, rightIcon, className = '', ...props }: InputProps & { ref?: React.RefObject<HTMLInputElement | null> }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={`
              w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-900
              placeholder:text-gray-400
              focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none
              disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
              ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${className}
            `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

Input.displayName = 'Input';

export default Input;

// Textarea variant
type TextareaProps = {
  label?: string;
  error?: string;
  helperText?: string;
  rows?: number;
} & InputHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = ({ ref, label, error, helperText, rows = 4, className = '', ...props }: TextareaProps & { ref?: React.RefObject<HTMLTextAreaElement | null> }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
            w-full resize-none rounded-lg border bg-white px-3.5 py-2.5 text-sm
            text-gray-900
            placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500
            focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50
            disabled:text-gray-500
            ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
            ${className}
          `}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

Textarea.displayName = 'Textarea';
