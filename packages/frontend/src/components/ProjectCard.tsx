import React from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { SpotlightCard } from './SpotlightCard';

interface ProjectCardProps {
  id: string;
  name: string;
  genre?: string;
  updatedLabel: string;
  accentColor: string;
  versionsCount: number;
}

export function ProjectCard({
  id,
  name,
  genre,
  updatedLabel,
  accentColor,
  versionsCount,
}: ProjectCardProps) {
  return (
    <SpotlightCard className="group relative overflow-hidden border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] hover:border-[var(--brand-primary)]/40 hover:bg-[var(--color-surface-elevated)] transition">
      <Link to={`/projects/${id}`} className="relative flex items-center gap-3 p-3">
        <div
          className="absolute left-0 top-0 bottom-0 w-1 opacity-80"
          style={{ backgroundColor: accentColor }}
          aria-hidden
        />
        <div
          className="w-10 h-10 rounded flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-[var(--shadow-xs)]"
          style={{ backgroundColor: accentColor }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-primary truncate">{name}</div>
          <div className="flex items-center gap-2 text-xs text-tertiary">
            <Clock className="w-3 h-3" />
            <span>{updatedLabel}</span>
            {genre && (
              <>
                <span>•</span>
                <span className="truncate">{genre}</span>
              </>
            )}
          </div>
        </div>
        <div className="text-xs text-secondary font-medium">
          {versionsCount} v
        </div>
      </Link>
    </SpotlightCard>
  );
}

