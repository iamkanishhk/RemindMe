import React, { useEffect, useRef } from 'react';

export function GlassButton({
  text = 'Button',
  size = 48,
  type = 'rounded',
  borderRadius,
  tintOpacity = 0.2,
  warp = false,
  onClick,
  className = '',
  style = {}
}) {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    // Ensure the vanilla classes are available in your environment
    if (typeof window === 'undefined' || !window.Button) return;

    // Instantiate the vanilla Button class
    const button = new window.Button({
      text,
      size,
      type,
      borderRadius,
      tintOpacity,
      warp,
      onClick: () => {
        if (onClick) onClick(text);
      }
    });

    instanceRef.current = button;

    if (containerRef.current) {
      containerRef.current.appendChild(button.element);
    }

    return () => {
      // Cleanup on unmount
      if (instanceRef.current && instanceRef.current.element) {
        instanceRef.current.element.remove();
      }
    };
  }, [text, size, type, borderRadius, tintOpacity, warp, onClick]);

  return (
    <div 
      ref={containerRef} 
      className={`glass-react-wrapper ${className}`} 
      style={{ display: 'inline-block', ...style }} 
    />
  );
}