/**
 * Tests for Layout component
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '../../test/utils';
import { Layout } from '../Layout';
import userEvent from '@testing-library/user-event';

describe('Layout', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should render navigation links', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    // Check for navigation items - some may appear multiple times so check they exist
    expect(screen.getByText('Projects')).toBeTruthy();
    expect(screen.getByText('Templates')).toBeTruthy();
    expect(screen.getByText('Tutorial')).toBeTruthy();
    expect(screen.getByText('Status')).toBeTruthy();
  });

  it('should render children content', () => {
    render(
      <Layout>
        <div>Test Child Content</div>
      </Layout>
    );

    expect(screen.getByText('Test Child Content')).toBeTruthy();
  });

  it('should render logo with correct text', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    expect(screen.getByText('GameStory Lab')).toBeTruthy();
    expect(screen.getByText('Experience Design OS')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();
  });

  it('should have theme toggle button', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    const themeButton = screen.getByRole('button', { name: /switch to/i });
    expect(themeButton).toBeTruthy();
  });

  it('should toggle theme when theme button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    const themeButton = screen.getByRole('button', { name: /switch to/i });

    // Initial state (light mode by default in test environment)
    expect(themeButton).toHaveAttribute('aria-label', 'Switch to dark mode');

    // Click to toggle
    await user.click(themeButton);

    // Should switch to light mode label (meaning we're now in dark mode)
    expect(themeButton).toHaveAttribute('aria-label', 'Switch to light mode');

    // Check localStorage was updated
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should render footer with links', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    expect(screen.getByText(/crafted with care/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /share feedback/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /read the tutorial/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /view on github/i })).toBeTruthy();
  });

  it('should have correct navigation structure', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeTruthy();
  });

  it('should have accessible logo link', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    const logoLink = screen.getByRole('link', { name: /gamestory lab home/i });
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('should have explore templates button', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    const exploreButton = screen.getByRole('link', { name: /explore templates/i });
    expect(exploreButton).toBeTruthy();
    expect(exploreButton).toHaveAttribute('href', '/templates');
  });
});
