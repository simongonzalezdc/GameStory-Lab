import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonCard, SkeletonGrid, SkeletonText } from './SkeletonLoader';

describe('SkeletonLoader', () => {
  describe('SkeletonCard', () => {
    it('renders skeleton card with correct structure', () => {
      const { container } = render(<SkeletonCard />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('has loading animation class', () => {
      const { container } = render(<SkeletonCard />);
      const card = container.querySelector('.animate-pulse');
      expect(card).toBeInTheDocument();
    });
  });

  describe('SkeletonGrid', () => {
    it('renders default number of skeleton cards', () => {
      const { container } = render(<SkeletonGrid />);
      const cards = container.querySelectorAll('.animate-pulse');
      expect(cards.length).toBe(6);
    });

    it('renders custom number of skeleton cards', () => {
      const { container } = render(<SkeletonGrid count={3} />);
      const cards = container.querySelectorAll('.animate-pulse');
      expect(cards.length).toBe(3);
    });

    it('uses grid layout', () => {
      const { container } = render(<SkeletonGrid />);
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('SkeletonText', () => {
    it('renders skeleton text element', () => {
      const { container } = render(<SkeletonText />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<SkeletonText className="custom-class" />);
      const element = container.querySelector('.custom-class');
      expect(element).toBeInTheDocument();
    });

    it('has loading animation class', () => {
      const { container } = render(<SkeletonText />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });
});
