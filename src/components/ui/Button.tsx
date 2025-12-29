import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'icon' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  isLoading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-jakarta font-semibold rounded-[12px] transition-all duration-200 inline-flex items-center justify-center min-w-[100px] tracking-[-0.14px] disabled:cursor-not-allowed';

  const variants = {
    primary: disabled
      ? 'bg-[#efe8fc] text-[#cebbf7]'
      : 'bg-purple-600 text-white hover:bg-purple-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-600/30 active:translate-y-0',
    secondary: 'bg-[#f0f0f3] text-[#090909] hover:bg-gray-200',
    icon: 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-[14px] px-[12px] py-[8px]',
    lg: 'text-base px-6 py-3',
  };

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${variant === 'icon' ? iconSizes[size] : sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading
        ? (
            <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )
        : children}
    </button>
  );
}

export default Button;
