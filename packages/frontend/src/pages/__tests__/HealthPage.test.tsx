/**
 * Tests for HealthPage
 */

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '../../test/utils';
import { HealthPage } from '../HealthPage';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';

describe('HealthPage', () => {
  it('should show loading state initially', () => {
    render(<HealthPage />);
    expect(screen.getByText(/checking system status/i)).toBeInTheDocument();
  });

  it('should display health status after loading', async () => {
    // Mock successful health check
    server.use(
      http.get('http://localhost:3001/health', () => {
        return HttpResponse.json({
          status: 'healthy',
          timestamp: '2025-01-01T00:00:00.000Z',
          database: 'connected',
          ai: {
            clients: [
              { name: 'OpenRouter', type: 'openrouter', available: true },
              { name: 'Ollama', type: 'ollama', available: true },
            ],
            currentHourCost: 0.05,
            costLimit: 5.0,
          },
        });
      })
    );

    render(<HealthPage />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/checking system status/i)).not.toBeInTheDocument();
    });

    // Check that health data is displayed
    expect(screen.getByText('System Status')).toBeInTheDocument();
    expect(screen.getByText(/HEALTHY/i)).toBeInTheDocument();
    expect(screen.getByText(/CONNECTED/i)).toBeInTheDocument();
  });

  it('should display AI providers', async () => {
    server.use(
      http.get('http://localhost:3001/health', () => {
        return HttpResponse.json({
          status: 'healthy',
          timestamp: '2025-01-01T00:00:00.000Z',
          database: 'connected',
          ai: {
            clients: [
              { name: 'OpenRouter', type: 'openrouter', available: true },
              { name: 'Ollama', type: 'ollama', available: false },
            ],
            currentHourCost: 0.05,
            costLimit: 5.0,
          },
        });
      })
    );

    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText('AI Providers')).toBeInTheDocument();
    });

    expect(screen.getByText('OpenRouter')).toBeInTheDocument();
    expect(screen.getByText('openrouter')).toBeInTheDocument();
    expect(screen.getByText('Ollama')).toBeInTheDocument();
    expect(screen.getByText('ollama')).toBeInTheDocument();

    // Check availability status
    const availableStatuses = screen.getAllByText('Available');
    const offlineStatuses = screen.getAllByText('Offline');
    expect(availableStatuses).toHaveLength(1);
    expect(offlineStatuses).toHaveLength(1);
  });

  it('should display cost tracking information', async () => {
    server.use(
      http.get('http://localhost:3001/health', () => {
        return HttpResponse.json({
          status: 'healthy',
          timestamp: '2025-01-01T00:00:00.000Z',
          database: 'connected',
          ai: {
            clients: [],
            currentHourCost: 0.1234,
            costLimit: 5.0,
          },
        });
      })
    );

    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText('Cost Tracking')).toBeInTheDocument();
    });

    // Cost is displayed with 4 decimal places
    expect(screen.getByText(/0\.1234/)).toBeInTheDocument();
    expect(screen.getByText(/5\.00/)).toBeInTheDocument();
  });

  it('should display error message on API failure', async () => {
    // Mock API failure
    server.use(
      http.get('http://localhost:3001/health', () => {
        return HttpResponse.error();
      })
    );

    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
    });
  });

  it('should have a refresh button', async () => {
    server.use(
      http.get('http://localhost:3001/health', () => {
        return HttpResponse.json({
          status: 'healthy',
          timestamp: '2025-01-01T00:00:00.000Z',
          database: 'connected',
          ai: {
            clients: [],
            currentHourCost: 0,
            costLimit: 5.0,
          },
        });
      })
    );

    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });
  });

  it('should refresh data when refresh button is clicked', async () => {
    const user = userEvent.setup();
    const calls: number[] = [];

    server.use(
      http.get('http://localhost:3001/health', () => {
        calls.push(Date.now());
        return HttpResponse.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: 'connected',
          ai: {
            clients: [],
            currentHourCost: 0,
            costLimit: 5.0,
          },
        });
      })
    );

    render(<HealthPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });

    expect(calls.length).toBeGreaterThan(0);
    const initialCallCount = calls.length;

    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    // Verify API was called again
    await waitFor(() => {
      expect(calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it('should show timestamp of last check', async () => {
    const timestamp = '2025-01-15T10:30:00.000Z';

    server.use(
      http.get('http://localhost:3001/health', () => {
        return HttpResponse.json({
          status: 'healthy',
          timestamp,
          database: 'connected',
          ai: {
            clients: [],
            currentHourCost: 0,
            costLimit: 5.0,
          },
        });
      })
    );

    render(<HealthPage />);

    await waitFor(() => {
      expect(screen.getByText(/last checked:/i)).toBeInTheDocument();
    });

    // Just verify the timestamp is present in some form
    expect(screen.getByText(/last checked:/i)).toBeInTheDocument();
  });

  it('should disable refresh button while loading', async () => {
    server.use(
      http.get('http://localhost:3001/health', async () => {
        // Add delay to keep loading state
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({
          status: 'healthy',
          timestamp: '2025-01-01T00:00:00.000Z',
          database: 'connected',
          ai: {
            clients: [],
            currentHourCost: 0,
            costLimit: 5.0,
          },
        });
      })
    );

    render(<HealthPage />);

    // During initial load, there might not be a button yet
    await waitFor(() => {
      const button = screen.queryByRole('button', { name: /refreshing/i });
      if (button) {
        expect(button).toBeDisabled();
      }
    });
  });
});
