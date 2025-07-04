import React from 'react';
import { ButtonProps } from '../types';

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  onClick
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-deep-bg focus:ring-cosmic-purple';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-cosmic-purple to-neon-pink text-soft-lavender hover:opacity-90 focus:ring-cosmic-purple',
    secondary: 'bg-gradient-to-r from-electric-cyan to-cosmic-purple text-soft-lavender hover:opacity-90 focus:ring-electric-cyan',
    outline: 'bg-transparent border border-cosmic-purple text-soft-lavender hover:bg-cosmic-purple/10 focus:ring-cosmic-purple'
  };
  
  const sizeClasses = {
    sm: 'text-sm px-3 py-1',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3'
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button