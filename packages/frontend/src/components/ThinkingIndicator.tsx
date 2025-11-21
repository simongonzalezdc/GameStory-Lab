import React, { useEffect, useState } from 'react';

interface ThinkingIndicatorProps {
  className?: string;
}

const THINKING_MESSAGES = [
  "Consulting the archives...",
  "Weaving narrative threads...",
  "Calculating probabilities...",
  "Polishing gemstones...",
  "Aligning constellations...",
  "Drafting blueprints...",
  "Synthesizing lore...",
  "Balancing mechanics..."
];

export function ThinkingIndicator({ className = '' }: ThinkingIndicatorProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % THINKING_MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col items-start gap-3 p-4 ${className}`}>
      {/* Awesome Morphing Spinner */}
      <div className="jewel-spinner">
        <div className="jewel-spinner-core" />
        <div className="sparkle" data-sparkle-index="0" />
        <div className="sparkle" data-sparkle-index="1" />
        <div className="sparkle" data-sparkle-index="2" />
        <div className="sparkle" data-sparkle-index="3" />
      </div>
      
      {/* Cycling Status Text */}
      <div className="h-5 relative overflow-hidden w-full">
        {THINKING_MESSAGES.map((msg, idx) => (
          <div
            key={msg}
            className={`absolute inset-0 transition-all duration-500 flex items-center
              ${idx === messageIndex 
                ? 'opacity-100 transform translate-y-0' 
                : 'opacity-0 transform -translate-y-2'
              }`}
          >
            <span 
              className="text-sm font-medium"
              style={{
                background: 'linear-gradient(135deg, var(--jewel-garnet-light), var(--jewel-amethyst-light), var(--jewel-garnet-light))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s infinite linear'
              }}
            >
              {msg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
