import './ShinyText.css';
import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
}

const ShinyText: React.FC<ShinyTextProps> = ({ text, disabled = false, speed = 5, className = '', style }) => {
  const animationDuration = `${speed}s`;
  
  const combinedStyle = {
    ...style,
    '--animation-duration': animationDuration
  } as React.CSSProperties;

  return (
    <h1 
      className={`shiny-text ${disabled ? 'disabled' : ''} ${className}`} 
      style={combinedStyle}
      data-text={text}
    >
      {text}
    </h1>
  );
};

export default ShinyText;
