import React from 'react';

/**
 * ReactLoader Component
 * Renders a clean, minimalist, and professional circular spinner.
 * Supports light/dark mode and adapts to various sizes.
 */
export default function ReactLoader({ 
  size = 'md', 
  text = 'Loading...', 
  fullscreen = false,
  inline = false
}) {
  const sizeClasses = {
    xs: 'w-4 h-4 border-2',
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-14 h-14 border-3',
    xl: 'w-20 h-20 border-4'
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  const spinner = (
    <div 
      className={`${currentSize} border-gray-200 dark:border-slate-800 border-t-brand-500 dark:border-t-cyan-400 rounded-full animate-spin`}
      style={{ borderStyle: 'solid' }}
    />
  );

  if (inline) {
    return spinner;
  }

  const content = (
    <div className="flex flex-col items-center justify-center space-y-4 select-none">
      {spinner}
      {text && (
        <p className="text-[10px] font-bold tracking-widest text-gray-500 dark:text-slate-400 uppercase animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/80 dark:bg-slate-950/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full p-8 min-h-[200px]">
      {content}
    </div>
  );
}
