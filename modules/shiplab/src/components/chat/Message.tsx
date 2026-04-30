'use client';

import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

export interface MessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export function Message({ role, content, timestamp }: MessageProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex w-full gap-3 p-4',
        isUser ? 'bg-muted/50' : 'bg-background'
      )}
    >
      <div className="flex-shrink-0">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'
          )}
        >
          {isUser ? 'U' : 'AI'}
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{isUser ? 'You' : 'ShipLab AI'}</span>
          {timestamp && (
            <span className="text-xs text-muted-foreground">
              {timestamp.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
