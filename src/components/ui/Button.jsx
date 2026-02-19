import React from 'react';
import { THEME } from '../../utils/theme';

export const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }) => {
  const baseStyle = "px-4 py-3 rounded-lg font-bold uppercase tracking-wider transition-all active:scale-95 shadow-[0_0_10px_rgba(168,85,247,0.3)]";
  const variants = {
    primary: `${THEME.primary} text-white border border-purple-500`,
    secondary: "bg-gray-800 text-white border border-gray-600 hover:bg-gray-700",
    outline: "bg-transparent border border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black",
    success: "bg-green-600 text-white hover:bg-green-500"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};
