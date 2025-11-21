import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProjectRowProps {
  id: string;
  name: string;
  genre?: string;
  updatedLabel: string;
  versionsCount: number;
  accentColor: string;
  onDelete: () => void;
  delay?: number;
}

export function ProjectRow({
  id,
  name,
  genre,
  updatedLabel,
  versionsCount,
  accentColor,
  onDelete,
  delay = 0,
}: ProjectRowProps) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-elevated)] transition"
    >
      <td className="px-4 py-3">
        <Link to={`/projects/${id}`} className="flex items-center gap-2 group">
          <div
            className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-[var(--shadow-xs)]"
            style={{ backgroundColor: accentColor }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-primary group-hover:text-[var(--brand-primary)] transition">
            {name}
          </span>
        </Link>
      </td>
      <td className="px-4 py-3">
        {genre ? (
          <span className="text-xs px-2 py-0.5 rounded border border-[var(--color-border-subtle)] text-secondary">
            {genre}
          </span>
        ) : (
          <span className="text-xs text-tertiary">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-primary">{versionsCount}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs text-tertiary">
          <Clock className="w-3 h-3" />
          <span>{updatedLabel}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/projects/${id}`}
            className="px-2 py-1 text-xs font-medium border border-[var(--color-border-subtle)] rounded text-secondary hover:text-primary hover:border-[var(--brand-primary)]/40 transition h-7"
          >
            Open
          </Link>
          <button
            type="button"
            onClick={onDelete}
            className="px-2 py-1 text-xs font-medium text-tertiary hover:text-[var(--color-error)] transition h-7"
            title="Delete project"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

