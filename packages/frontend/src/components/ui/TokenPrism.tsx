import React, { useMemo } from 'react';

const JEWEL_PALETTE = [
  '#5A7850', // Emerald
  '#344676', // Sapphire
  '#6B5D88', // Amethyst
  '#AE5D37', // Fire Opal
  '#B5933C'  // Topaz
];

interface TokenPrismProps {
  content: string;
  isVisible: boolean; // Controls opacity/display logic
}

export const TokenPrism = React.memo(({ content, isVisible }: TokenPrismProps) => {
  const tokens = useMemo(() => {
    // Heuristic split: Space, punctuation, or word boundaries
    return content.split(/(\s+|[.,;!?(){}[\]]|\b)/g).filter(t => t.length > 0);
  }, [content]);

  if (!isVisible) return null;

  return (
    <div className="font-mono text-[15px] leading-relaxed break-words">
      {tokens.map((token, i) => (
        <span
          key={i}
          style={{ color: JEWEL_PALETTE[i % JEWEL_PALETTE.length] }}
          className="inline-block hover:bg-white/10 rounded-sm transition-colors duration-300"
          title={`Token #${i}`}
        >
          {token}
        </span>
      ))}
    </div>
  );
});

TokenPrism.displayName = 'TokenPrism';

