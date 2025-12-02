
import React from 'react';
import { soundService } from '../services/soundService';

// A reusable container looking like a blue holographic window
export const SystemWindow: React.FC<{ 
  children: React.ReactNode; 
  title?: string; 
  className?: string;
  variant?: 'normal' | 'danger'
}> = ({ children, title, className = "", variant = 'normal' }) => {
  const borderColor = variant === 'danger' ? 'border-red-500' : 'border-cyan-500';
  const glowClass = variant === 'danger' ? 'danger-glow' : 'system-glow';
  const titleBg = variant === 'danger' ? 'bg-red-900/50' : 'bg-cyan-900/50';
  const titleText = variant === 'danger' ? 'text-red-300' : 'text-cyan-300';

  return (
    <div className={`relative border-2 ${borderColor} bg-slate-900/90 backdrop-blur-sm ${glowClass} p-1 ${className}`}>
      {title && (
        <div className={`absolute -top-4 left-4 px-3 py-1 ${titleBg} border ${borderColor} text-xs font-bold tracking-widest uppercase ${titleText}`}>
          {title}
        </div>
      )}
      <div className="p-4 h-full">
        {children}
      </div>
      {/* Decorative corners */}
      <div className={`absolute -top-1 -left-1 w-2 h-2 ${variant === 'danger' ? 'bg-red-500' : 'bg-cyan-500'}`} />
      <div className={`absolute -top-1 -right-1 w-2 h-2 ${variant === 'danger' ? 'bg-red-500' : 'bg-cyan-500'}`} />
      <div className={`absolute -bottom-1 -left-1 w-2 h-2 ${variant === 'danger' ? 'bg-red-500' : 'bg-cyan-500'}`} />
      <div className={`absolute -bottom-1 -right-1 w-2 h-2 ${variant === 'danger' ? 'bg-red-500' : 'bg-cyan-500'}`} />
    </div>
  );
};

export const Button: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
}> = ({ onClick, children, disabled, variant = 'primary', className = '' }) => {
  let baseStyles = "px-6 py-2 font-mono-tech font-bold uppercase transition-all duration-200 border clip-path-polygon";
  
  if (variant === 'primary') {
    baseStyles += " bg-cyan-600/20 border-cyan-400 text-cyan-100 hover:bg-cyan-500 hover:text-white hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]";
  } else if (variant === 'danger') {
    baseStyles += " bg-red-600/20 border-red-500 text-red-100 hover:bg-red-600 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]";
  } else {
    baseStyles += " bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700";
  }

  if (disabled) {
    baseStyles = "px-6 py-2 font-mono-tech font-bold uppercase border border-slate-700 bg-slate-800 text-slate-500 cursor-not-allowed";
  }

  const handleClick = () => {
    if (!disabled) {
        soundService.playClick();
        onClick();
    }
  };

  return (
    <button onClick={handleClick} disabled={disabled} className={`${baseStyles} ${className}`}>
      {children}
    </button>
  );
};

export const ProgressBar: React.FC<{ current: number; max: number; label?: string; color?: string }> = ({ current, max, label, color = "bg-cyan-500" }) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  
  return (
    <div className="w-full mb-3">
      {label && (
        <div className="flex justify-between text-xs uppercase tracking-wider mb-1 text-slate-400 font-mono-tech">
          <span>{label}</span>
          <span>{current} / {max}</span>
        </div>
      )}
      <div className="h-2 w-full bg-slate-800 border border-slate-700 relative overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500 ease-out shadow-[0_0_10px_currentColor]`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
