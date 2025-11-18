import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorMessage } from './ErrorMessage';

describe('ErrorMessage', () => {
  it('renders error message', () => {
    render(<ErrorMessage error="Test error message" />);
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('shows suggestion based on error type', () => {
    render(<ErrorMessage error="API key not configured" />);
    expect(screen.getByText(/Check your API keys/)).toBeInTheDocument();
  });

  it('shows custom suggestion when provided', () => {
    render(<ErrorMessage error="Some error" suggestion="Custom suggestion text" />);
    expect(screen.getByText('Custom suggestion text')).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<ErrorMessage error="Test error" onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorMessage error="Test error" />);
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('provides Ollama suggestion for Ollama errors', () => {
    render(<ErrorMessage error="Cannot connect to Ollama" />);
    expect(screen.getByText(/Ollama is not running/)).toBeInTheDocument();
  });

  it('provides rate limit suggestion for 429 errors', () => {
    render(<ErrorMessage error="429 Rate limit exceeded" />);
    expect(screen.getByText(/Wait a few minutes and try again/)).toBeInTheDocument();
  });

  it('provides network suggestion for connection errors', () => {
    render(<ErrorMessage error="Network connection failed" />);
    expect(screen.getByText(/Network connection issue/)).toBeInTheDocument();
  });
});
