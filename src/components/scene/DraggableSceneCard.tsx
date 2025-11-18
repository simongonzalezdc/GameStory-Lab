/**
 * Draggable wrapper for SceneCard
 */

import { useState } from 'react';
import SceneCard from './SceneCard';
import type { Scene } from '@/types';

interface DraggableSceneCardProps {
  scene: Scene;
  index: number;
  onDragEnd: (fromIndex: number, toIndex: number) => void;
}

export default function DraggableSceneCard({ scene, index, onDragEnd }: DraggableSceneCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (fromIndex !== index) {
      onDragEnd(fromIndex, index);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={isDragging ? 'opacity-50' : ''}
      role="button"
      aria-label={`Drag to reorder scene ${scene.name}`}
      tabIndex={0}
    >
      <SceneCard scene={scene} />
    </div>
  );
}

