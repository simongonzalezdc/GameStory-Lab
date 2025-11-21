import React, { useEffect, useState } from 'react';
import { JewelSpinner } from './JewelSpinner';

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
      <div className="flex w-full flex-col gap-4 items-start sm:flex-row sm:items-center">
        <div className="flex-shrink-0">
          <JewelSpinner size="md" />
        </div>
        <div className="flex-1 min-w-0">
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
                    background: 'linear-gradient(135deg, var(--jewel-sapphire), var(--jewel-amethyst), var(--jewel-garnet), var(--jewel-amethyst), var(--jewel-sapphire))',
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
      </div>
    </div>
  );
}
