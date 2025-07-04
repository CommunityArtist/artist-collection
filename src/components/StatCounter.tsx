import React, { useState, useEffect } from 'react';
import { StatCounterProps } from '../types';

const StatCounter: React.FC<StatCounterProps> = ({ value, label }) => {
  const [animatedValue, setAnimatedValue] = useState('0');
  
  useEffect(() => {
    // Simple animation for demonstration
    // In a real implementation, you might want to use a library like CountUp.js
    const timeout = setTimeout(() => {
      setAnimatedValue(value);
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [value]);
  
  return (
    <div className="flex flex-col items-center">
      <span className="text-electric-cyan text-4xl font-bold mb-2 transition-all duration-1000">
        {animatedValue}
      </span>
      <span className="text-soft-lavender/70 text-sm">
        {label}
      </span>
    </div>
  );
};

export default StatCounter;