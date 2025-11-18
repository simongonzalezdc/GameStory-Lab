import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';
import * as ThemeContext from '../contexts/ThemeContext';

// Mock the useTheme hook
vi.mock('../contexts/ThemeContext', () => ({
  useTheme: vi.fn(),
}));

describe('ThemeToggle', () => {
  it('renders moon icon in light mode', () => {
    const toggleTheme = vi.fn();
    vi.spyOn(ThemeContext, 'useTheme').mockReturnValue({
      theme: 'light',
      toggleTheme,
    });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'Switch to dark mode');
  });

  it('renders sun icon in dark mode', () => {
    const toggleTheme = vi.fn();
    vi.spyOn(ThemeContext, 'useTheme').mockReturnValue({
      theme: 'dark',
      toggleTheme,
    });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Switch to light mode');
  });

  it('calls toggleTheme when clicked', () => {
    const toggleTheme = vi.fn();
    vi.spyOn(ThemeContext, 'useTheme').mockReturnValue({
      theme: 'light',
      toggleTheme,
    });

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });
});
