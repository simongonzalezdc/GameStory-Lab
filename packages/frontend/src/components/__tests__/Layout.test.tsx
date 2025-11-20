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

    expect(screen.getByText('Projects')).toBeTruthy();
    expect(screen.getByText('Assistant')).toBeTruthy();
    expect(screen.getByText('Settings')).toBeTruthy();
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

  it('should render footer with links', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );

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

  it('should open settings menu and show entries', async () => {
    const user = userEvent.setup();

    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);

    expect(screen.getByText(/workspace settings/i)).toBeInTheDocument();
    expect(screen.getByText(/view tutorial/i)).toBeInTheDocument();
    expect(screen.getByText(/system status/i)).toBeInTheDocument();
    expect(screen.getByText(/reset tutorial/i)).toBeInTheDocument();
  });
});
