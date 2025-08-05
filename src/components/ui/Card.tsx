import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick
}) => {
  return (
    <div
      className={`bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 ${
        onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};