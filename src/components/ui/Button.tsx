import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'link' | 'inverse';
type ButtonSize = 'sm' | 'md';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-dark text-white hover:bg-brand-dark/90 active:bg-navy',
  secondary: 'bg-white text-ink border border-line hover:bg-offwhite hover:border-muted/40',
  link: 'text-brand-dark hover:text-navy underline-offset-4 hover:underline px-0',
  inverse: 'bg-white text-navy hover:bg-brand-light',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-3.5 text-sm gap-1.5',
  md: 'min-h-11 px-4 text-[15px] gap-2',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...props
}) => (
  <button
    type={type}
    className={`inline-flex items-center justify-center rounded-md font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none ${
      VARIANTS[variant]
    } ${variant === 'link' ? 'min-h-0 text-sm gap-1' : SIZES[size]} ${className}`}
    {...props}
  >
    {children}
  </button>
);
