import React from 'react';

interface LoadingSpinnerProps {
  fullPage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  fullPage = false,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const spinner = (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-t-2 border-b-2 border-blue-500 ${sizeClasses[size]}`}
      />
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
